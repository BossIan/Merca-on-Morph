// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./MercaKYC.sol";
import "./MercaWallet.sol";

/**
 * @title  MercaInvoice
 * @notice Core invoice and payment contract for the MERCA system (Process 2 & 3 of DFD).
 *
 * Day 3 changes:
 *   - Checks MercaKYC before merchant can createInvoice (must be Full KYC)
 *   - Routes settlement to MercaWallet instead of paying merchant directly
 *   - MercaWallet address and KYC address are configurable by owner
 *
 * Flow:
 *   Merchant (KYC verified) calls createInvoice()
 *   Customer calls payInvoice()
 *     → fee goes to feeRecipient
 *     → merchant amount goes to MercaWallet.settle()
 *   Merchant calls MercaWallet.withdraw() to pull funds
 */
contract MercaInvoice is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ─── Types ────────────────────────────────────────────────────────────────

    enum Status {
        Pending,
        Paid,
        Cancelled,
        Expired
    }

    struct Invoice {
        bytes32  id;
        address  merchant;
        address  customer;
        uint256  amount;
        address  token;
        Status   status;
        uint256  createdAt;
        uint256  expiresAt;
        string   description;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    mapping(bytes32 => Invoice)     public invoices;
    mapping(address => bytes32[])   public merchantInvoices;
    mapping(address => bool)        public acceptedTokens;

    uint256        public feeBps;
    address        public feeRecipient;

    /// pluggable KYC and Wallet contracts
    MercaKYC       public kyc;
    MercaWallet    public wallet;

    /// if true, merchants must pass KYC to create invoices
    bool           public kycRequired;

    // ─── Events ───────────────────────────────────────────────────────────────

    event InvoiceCreated(
        bytes32 indexed id,
        address indexed merchant,
        address indexed token,
        uint256 amount,
        uint256 expiresAt
    );
    event InvoicePaid(
        bytes32 indexed id,
        address indexed payer,
        address indexed merchant,
        uint256 amount,
        uint256 fee
    );
    event InvoiceCancelled(bytes32 indexed id, address indexed merchant);
    event InvoiceExpired(bytes32 indexed id);
    event TokenWhitelisted(address indexed token, bool accepted);
    event FeeUpdated(uint256 feeBps, address feeRecipient);
    event KYCContractUpdated(address kyc);
    event WalletContractUpdated(address wallet);
    event KYCRequiredUpdated(bool required);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error InvoiceAlreadyExists(bytes32 id);
    error InvoiceNotFound(bytes32 id);
    error InvoiceNotPending(bytes32 id, Status status);
    error InvoiceExpiredError(bytes32 id);
    error TokenNotAccepted(address token);
    error InvalidAmount();
    error InvalidMerchant();
    error NotMerchant(bytes32 id);
    error WrongCustomer(bytes32 id);
    error FeeTooHigh();
    error KYCNotVerified(address merchant);
    error WalletNotSet();

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        address _feeRecipient,
        uint256 _feeBps,
        address _kyc,
        address _wallet
    ) Ownable(msg.sender) {
        if (_feeBps > 1000) revert FeeTooHigh();
        feeRecipient = _feeRecipient;
        feeBps       = _feeBps;
        kyc          = MercaKYC(_kyc);
        wallet       = MercaWallet(_wallet);
        kycRequired  = true;
    }

    // ─── Merchant Functions ───────────────────────────────────────────────────

    /**
     * @notice Create a new invoice. Merchant must be KYC verified (Full level).
     */
    function createInvoice(
        bytes32 id,
        address customer,
        uint256 amount,
        address token,
        uint256 expiresAt,
        string calldata description
    ) external whenNotPaused {
        if (invoices[id].createdAt != 0) revert InvoiceAlreadyExists(id);
        if (amount == 0) revert InvalidAmount();
        if (!acceptedTokens[token]) revert TokenNotAccepted(token);
        if (expiresAt != 0 && expiresAt <= block.timestamp) revert InvalidAmount();

        // KYC check — merchant must have Full KYC
        if (kycRequired && !kyc.isMerchantVerified(msg.sender)) {
            revert KYCNotVerified(msg.sender);
        }

        invoices[id] = Invoice({
            id:          id,
            merchant:    msg.sender,
            customer:    customer,
            amount:      amount,
            token:       token,
            status:      Status.Pending,
            createdAt:   block.timestamp,
            expiresAt:   expiresAt,
            description: description
        });

        merchantInvoices[msg.sender].push(id);
        emit InvoiceCreated(id, msg.sender, token, amount, expiresAt);
    }

    /**
     * @notice Cancel a pending invoice.
     */
    function cancelInvoice(bytes32 id) external {
        Invoice storage inv = invoices[id];
        if (inv.createdAt == 0) revert InvoiceNotFound(id);
        if (inv.merchant != msg.sender) revert NotMerchant(id);
        if (inv.status != Status.Pending) revert InvoiceNotPending(id, inv.status);

        inv.status = Status.Cancelled;
        emit InvoiceCancelled(id, msg.sender);
    }

    // ─── Customer Functions ───────────────────────────────────────────────────

    /**
     * @notice Pay an invoice.
     *         Customer approves this contract for invoice.amount.
     *         Fee goes to feeRecipient.
     *         Merchant amount is settled into MercaWallet (walletId 0 = default).
     */
    function payInvoice(bytes32 id) external nonReentrant whenNotPaused {
        Invoice storage inv = invoices[id];

        if (inv.createdAt == 0) revert InvoiceNotFound(id);
        if (inv.status != Status.Pending) revert InvoiceNotPending(id, inv.status);

        // check expiry
        if (inv.expiresAt != 0 && block.timestamp > inv.expiresAt) {
            inv.status = Status.Expired;
            emit InvoiceExpired(id);
            revert InvoiceExpiredError(id);
        }

        // check customer restriction
        if (inv.customer != address(0) && inv.customer != msg.sender) {
            revert WrongCustomer(id);
        }

        // checks-effects-interactions
        inv.status = Status.Paid;

        uint256 fee            = (inv.amount * feeBps) / 10_000;
        uint256 merchantAmount = inv.amount - fee;

        IERC20 token = IERC20(inv.token);

        // pull full amount from customer
        token.safeTransferFrom(msg.sender, address(this), inv.amount);

        // send fee to feeRecipient
        if (fee > 0) {
            token.safeTransfer(feeRecipient, fee);
        }

        // settle merchant amount into MercaWallet
        token.forceApprove(address(wallet), merchantAmount);
        wallet.settle(inv.merchant, inv.token, 0, merchantAmount);

        emit InvoicePaid(id, msg.sender, inv.merchant, merchantAmount, fee);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function getInvoice(bytes32 id) external view returns (Invoice memory) {
        if (invoices[id].createdAt == 0) revert InvoiceNotFound(id);
        return invoices[id];
    }

    function getMerchantInvoices(address merchant) external view returns (bytes32[] memory) {
        return merchantInvoices[merchant];
    }

    function isExpired(bytes32 id) external view returns (bool) {
        Invoice storage inv = invoices[id];
        return inv.expiresAt != 0 && block.timestamp > inv.expiresAt;
    }

    // ─── Owner Functions ──────────────────────────────────────────────────────

    function setAcceptedToken(address token, bool accepted) external onlyOwner {
        acceptedTokens[token] = accepted;
        emit TokenWhitelisted(token, accepted);
    }

    function setFee(uint256 _feeBps, address _feeRecipient) external onlyOwner {
        if (_feeBps > 1000) revert FeeTooHigh();
        feeBps       = _feeBps;
        feeRecipient = _feeRecipient;
        emit FeeUpdated(_feeBps, _feeRecipient);
    }

    function setKYC(address _kyc) external onlyOwner {
        kyc = MercaKYC(_kyc);
        emit KYCContractUpdated(_kyc);
    }

    function setWallet(address _wallet) external onlyOwner {
        wallet = MercaWallet(_wallet);
        emit WalletContractUpdated(_wallet);
    }

    function setKYCRequired(bool _required) external onlyOwner {
        kycRequired = _required;
        emit KYCRequiredUpdated(_required);
    }

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
