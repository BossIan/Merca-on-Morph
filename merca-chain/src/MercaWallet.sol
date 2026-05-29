// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title  MercaWallet
 * @notice Settlement and multi-wallet contract for MERCA (Process 4 of DFD).
 *         Receives settled funds from MercaInvoice and tracks per-merchant balances.
 *         Merchants can have multiple named sub-wallets (e.g. "main", "savings").
 *
 * Flow:
 *   MercaInvoice pays merchant directly OR calls settle() to hold funds here
 *   Merchant calls withdraw() to pull funds to any address
 *   Merchant can split across sub-wallets for accounting
 */
contract MercaWallet is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ─── Types ────────────────────────────────────────────────────────────────

    struct SubWallet {
        string  name;
        address withdrawTo;   // address funds are sent to on withdraw
        bool    active;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    /// merchant → token → walletId → balance
    mapping(address => mapping(address => mapping(uint256 => uint256))) public balances;

    /// merchant → walletId → SubWallet
    mapping(address => mapping(uint256 => SubWallet)) public subWallets;

    /// merchant → next wallet ID counter
    mapping(address => uint256) public walletCount;

    /// authorized settlers (MercaInvoice contract address)
    mapping(address => bool) public settlers;

    /// whitelisted tokens
    mapping(address => bool) public acceptedTokens;

    // ─── Events ───────────────────────────────────────────────────────────────

    event Settled(
        address indexed merchant,
        address indexed token,
        uint256 indexed walletId,
        uint256 amount,
        address settler
    );

    event Withdrawn(
        address indexed merchant,
        address indexed token,
        uint256 indexed walletId,
        uint256 amount,
        address to
    );

    event SubWalletCreated(address indexed merchant, uint256 walletId, string name, address withdrawTo);
    event SubWalletUpdated(address indexed merchant, uint256 walletId, address withdrawTo);
    event SubWalletDeactivated(address indexed merchant, uint256 walletId);
    event SettlerSet(address indexed settler, bool approved);
    event TokenSet(address indexed token, bool accepted);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error NotSettler();
    error TokenNotAccepted(address token);
    error WalletNotFound(uint256 walletId);
    error WalletInactive(uint256 walletId);
    error InsufficientBalance(uint256 available, uint256 requested);
    error InvalidAmount();
    error NotMerchant();

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ─── Settler Functions ────────────────────────────────────────────────────

    /**
     * @notice Called by MercaInvoice to settle funds into a merchant's wallet.
     * @param merchant  Merchant address.
     * @param token     Stablecoin address.
     * @param walletId  Sub-wallet ID (0 = default wallet).
     * @param amount    Amount to settle.
     */
    function settle(
        address merchant,
        address token,
        uint256 walletId,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        if (!settlers[msg.sender]) revert NotSettler();
        if (!acceptedTokens[token]) revert TokenNotAccepted(token);
        if (amount == 0) revert InvalidAmount();

        // auto-create default wallet if first time
        if (walletCount[merchant] == 0) {
            _createSubWallet(merchant, "default", merchant);
        }

        SubWallet storage w = subWallets[merchant][walletId];
        if (!w.active) revert WalletInactive(walletId);

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        balances[merchant][token][walletId] += amount;

        emit Settled(merchant, token, walletId, amount, msg.sender);
    }

    // ─── Merchant Functions ───────────────────────────────────────────────────

    /**
     * @notice Create a new sub-wallet.
     * @param name        Label for this wallet (e.g. "main", "savings", "tax").
     * @param withdrawTo  Address funds are sent to when withdrawing from this wallet.
     */
    function createSubWallet(
        string calldata name,
        address withdrawTo
    ) external whenNotPaused returns (uint256 walletId) {
        walletId = _createSubWallet(msg.sender, name, withdrawTo);
    }

    /**
     * @notice Update the withdrawal address of a sub-wallet.
     */
    function updateSubWallet(uint256 walletId, address withdrawTo) external {
        SubWallet storage w = subWallets[msg.sender][walletId];
        if (!w.active) revert WalletInactive(walletId);
        w.withdrawTo = withdrawTo;
        emit SubWalletUpdated(msg.sender, walletId, withdrawTo);
    }

    /**
     * @notice Deactivate a sub-wallet (must have zero balance first).
     */
    function deactivateSubWallet(uint256 walletId, address token) external {
        if (balances[msg.sender][token][walletId] > 0) {
            revert InsufficientBalance(0, balances[msg.sender][token][walletId]);
        }
        subWallets[msg.sender][walletId].active = false;
        emit SubWalletDeactivated(msg.sender, walletId);
    }

    /**
     * @notice Withdraw funds from a sub-wallet.
     * @param token     Stablecoin address.
     * @param walletId  Sub-wallet to withdraw from.
     * @param amount    Amount to withdraw. Use type(uint256).max for full balance.
     */
    function withdraw(
        address token,
        uint256 walletId,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        SubWallet storage w = subWallets[msg.sender][walletId];
        if (!w.active) revert WalletInactive(walletId);

        uint256 available = balances[msg.sender][token][walletId];

        // max withdrawal
        if (amount == type(uint256).max) amount = available;
        if (amount == 0) revert InvalidAmount();
        if (available < amount) revert InsufficientBalance(available, amount);

        balances[msg.sender][token][walletId] -= amount;
        IERC20(token).safeTransfer(w.withdrawTo, amount);

        emit Withdrawn(msg.sender, token, walletId, amount, w.withdrawTo);
    }

    /**
     * @notice Move funds between sub-wallets (internal accounting only, no transfer).
     */
    function moveBalance(
        address token,
        uint256 fromWalletId,
        uint256 toWalletId,
        uint256 amount
    ) external {
        SubWallet storage from = subWallets[msg.sender][fromWalletId];
        SubWallet storage to   = subWallets[msg.sender][toWalletId];

        if (!from.active) revert WalletInactive(fromWalletId);
        if (!to.active)   revert WalletInactive(toWalletId);

        uint256 available = balances[msg.sender][token][fromWalletId];
        if (available < amount) revert InsufficientBalance(available, amount);

        balances[msg.sender][token][fromWalletId] -= amount;
        balances[msg.sender][token][toWalletId]   += amount;
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function getBalance(
        address merchant,
        address token,
        uint256 walletId
    ) external view returns (uint256) {
        return balances[merchant][token][walletId];
    }

    function getSubWallet(
        address merchant,
        uint256 walletId
    ) external view returns (SubWallet memory) {
        return subWallets[merchant][walletId];
    }

    function getTotalBalance(
        address merchant,
        address token
    ) external view returns (uint256 total) {
        uint256 count = walletCount[merchant];
        for (uint256 i = 0; i < count; i++) {
            total += balances[merchant][token][i];
        }
    }

    // ─── Owner Functions ──────────────────────────────────────────────────────

    function setSettler(address settler, bool approved) external onlyOwner {
        settlers[settler] = approved;
        emit SettlerSet(settler, approved);
    }

    function setAcceptedToken(address token, bool accepted) external onlyOwner {
        acceptedTokens[token] = accepted;
        emit TokenSet(token, accepted);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _createSubWallet(
        address merchant,
        string memory name,
        address withdrawTo
    ) internal returns (uint256 walletId) {
        walletId = walletCount[merchant];
        subWallets[merchant][walletId] = SubWallet({
            name:       name,
            withdrawTo: withdrawTo,
            active:     true
        });
        walletCount[merchant]++;
        emit SubWalletCreated(merchant, walletId, name, withdrawTo);
    }
}
