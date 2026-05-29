// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MercaInvoice.sol";
import "../src/MercaKYC.sol";
import "../src/MercaWallet.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract MercaInvoiceTest is Test {
    MercaInvoice public invoice;
    MercaKYC     public kyc;
    MercaWallet  public wallet;
    MockUSDC     public usdc;

    address owner        = makeAddr("owner");
    address feeRecipient = makeAddr("feeRecipient");
    address merchant     = makeAddr("merchant");
    address customer     = makeAddr("customer");
    address stranger     = makeAddr("stranger");

    uint256 constant FEE_BPS  = 50;
    uint256 constant AMOUNT   = 100e6;
    bytes32 constant INV_ID   = keccak256("invoice-001");
    bytes32 constant INV_ID_2 = keccak256("invoice-002");

    function setUp() public {
        vm.startPrank(owner);

        usdc    = new MockUSDC();
        kyc     = new MercaKYC();
        wallet  = new MercaWallet();
        invoice = new MercaInvoice(feeRecipient, FEE_BPS, address(kyc), address(wallet));

        // whitelist USDC on invoice and wallet
        invoice.setAcceptedToken(address(usdc), true);
        wallet.setAcceptedToken(address(usdc), true);

        // authorize invoice as settler on wallet
        wallet.setSettler(address(invoice), true);

        // KYC verify merchant (Full) and customer (Basic)
        kyc.verifyAddress(merchant, MercaKYC.KYCLevel.Full,  0);
        kyc.verifyAddress(customer, MercaKYC.KYCLevel.Basic, 0);

        vm.stopPrank();

        // fund and approve customer
        usdc.mint(customer, 1000e6);
        vm.prank(customer);
        usdc.approve(address(invoice), type(uint256).max);
    }

    // ─── createInvoice ────────────────────────────────────────────────────────

    function test_CreateInvoice_Success() public {
        vm.prank(merchant);
        invoice.createInvoice(INV_ID, address(0), AMOUNT, address(usdc), 0, "Test invoice");

        MercaInvoice.Invoice memory inv = invoice.getInvoice(INV_ID);
        assertEq(inv.merchant,    merchant);
        assertEq(inv.amount,      AMOUNT);
        assertEq(inv.token,       address(usdc));
        assertEq(uint(inv.status), uint(MercaInvoice.Status.Pending));
        assertEq(inv.description, "Test invoice");
    }

    function test_CreateInvoice_RevertIf_KYCNotVerified() public {
        address noKYC = makeAddr("noKYC");
        vm.prank(noKYC);
        vm.expectRevert(abi.encodeWithSelector(MercaInvoice.KYCNotVerified.selector, noKYC));
        invoice.createInvoice(INV_ID, address(0), AMOUNT, address(usdc), 0, "");
    }

    function test_CreateInvoice_RevertIf_BasicKYCNotEnough() public {
        // customer has Basic KYC only — not enough to create invoices
        vm.prank(customer);
        vm.expectRevert(abi.encodeWithSelector(MercaInvoice.KYCNotVerified.selector, customer));
        invoice.createInvoice(INV_ID, address(0), AMOUNT, address(usdc), 0, "");
    }

    function test_CreateInvoice_KYCDisabled_AnyoneCanCreate() public {
        vm.prank(owner);
        invoice.setKYCRequired(false);

        address noKYC = makeAddr("noKYC");
        vm.prank(noKYC);
        invoice.createInvoice(INV_ID, address(0), AMOUNT, address(usdc), 0, "");

        assertEq(invoice.getInvoice(INV_ID).merchant, noKYC);
    }

    function test_CreateInvoice_EmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit MercaInvoice.InvoiceCreated(INV_ID, merchant, address(usdc), AMOUNT, 0);

        vm.prank(merchant);
        invoice.createInvoice(INV_ID, address(0), AMOUNT, address(usdc), 0, "");
    }

    function test_CreateInvoice_TracksMerchant() public {
        vm.startPrank(merchant);
        invoice.createInvoice(INV_ID,   address(0), AMOUNT, address(usdc), 0, "");
        invoice.createInvoice(INV_ID_2, address(0), AMOUNT, address(usdc), 0, "");
        vm.stopPrank();

        bytes32[] memory ids = invoice.getMerchantInvoices(merchant);
        assertEq(ids.length, 2);
    }

    function test_CreateInvoice_RevertIf_DuplicateId() public {
        vm.startPrank(merchant);
        invoice.createInvoice(INV_ID, address(0), AMOUNT, address(usdc), 0, "");
        vm.expectRevert(abi.encodeWithSelector(MercaInvoice.InvoiceAlreadyExists.selector, INV_ID));
        invoice.createInvoice(INV_ID, address(0), AMOUNT, address(usdc), 0, "");
        vm.stopPrank();
    }

    function test_CreateInvoice_RevertIf_ZeroAmount() public {
        vm.prank(merchant);
        vm.expectRevert(MercaInvoice.InvalidAmount.selector);
        invoice.createInvoice(INV_ID, address(0), 0, address(usdc), 0, "");
    }

    function test_CreateInvoice_RevertIf_TokenNotWhitelisted() public {
        address fakeToken = makeAddr("fakeToken");
        vm.prank(merchant);
        vm.expectRevert(abi.encodeWithSelector(MercaInvoice.TokenNotAccepted.selector, fakeToken));
        invoice.createInvoice(INV_ID, address(0), AMOUNT, fakeToken, 0, "");
    }

    // ─── payInvoice ───────────────────────────────────────────────────────────

    function test_PayInvoice_SettlesToWallet() public {
        vm.prank(merchant);
        invoice.createInvoice(INV_ID, address(0), AMOUNT, address(usdc), 0, "");

        uint256 expectedFee      = (AMOUNT * FEE_BPS) / 10_000;
        uint256 expectedMerchant = AMOUNT - expectedFee;

        vm.prank(customer);
        invoice.payInvoice(INV_ID);

        // fee goes to feeRecipient directly
        assertEq(usdc.balanceOf(feeRecipient), expectedFee);

        // merchant amount settled into wallet (not to merchant address directly)
        assertEq(usdc.balanceOf(merchant), 0);
        assertEq(wallet.getBalance(merchant, address(usdc), 0), expectedMerchant);

        assertEq(uint(invoice.getInvoice(INV_ID).status), uint(MercaInvoice.Status.Paid));
    }

    function test_PayInvoice_MerchantCanWithdrawAfter() public {
        vm.prank(merchant);
        invoice.createInvoice(INV_ID, address(0), AMOUNT, address(usdc), 0, "");

        vm.prank(customer);
        invoice.payInvoice(INV_ID);

        uint256 expectedMerchant = AMOUNT - (AMOUNT * FEE_BPS) / 10_000;

        // merchant withdraws from wallet
        vm.prank(merchant);
        wallet.withdraw(address(usdc), 0, type(uint256).max);

        assertEq(usdc.balanceOf(merchant), expectedMerchant);
        assertEq(wallet.getBalance(merchant, address(usdc), 0), 0);
    }

    function test_PayInvoice_EmitsEvent() public {
        vm.prank(merchant);
        invoice.createInvoice(INV_ID, address(0), AMOUNT, address(usdc), 0, "");

        uint256 fee = (AMOUNT * FEE_BPS) / 10_000;

        vm.expectEmit(true, true, true, true);
        emit MercaInvoice.InvoicePaid(INV_ID, customer, merchant, AMOUNT - fee, fee);

        vm.prank(customer);
        invoice.payInvoice(INV_ID);
    }

    function test_PayInvoice_OpenInvoice_AnyoneCanPay() public {
        vm.prank(merchant);
        invoice.createInvoice(INV_ID, address(0), AMOUNT, address(usdc), 0, "");

        usdc.mint(stranger, AMOUNT);
        vm.startPrank(stranger);
        usdc.approve(address(invoice), type(uint256).max);
        invoice.payInvoice(INV_ID);
        vm.stopPrank();

        assertEq(uint(invoice.getInvoice(INV_ID).status), uint(MercaInvoice.Status.Paid));
    }

    function test_PayInvoice_LockedToCustomer_RevertIf_Stranger() public {
        vm.prank(merchant);
        invoice.createInvoice(INV_ID, customer, AMOUNT, address(usdc), 0, "");

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(MercaInvoice.WrongCustomer.selector, INV_ID));
        invoice.payInvoice(INV_ID);
    }

    function test_PayInvoice_RevertIf_AlreadyPaid() public {
        vm.prank(merchant);
        invoice.createInvoice(INV_ID, address(0), AMOUNT, address(usdc), 0, "");

        vm.prank(customer);
        invoice.payInvoice(INV_ID);

        vm.prank(customer);
        vm.expectRevert(
            abi.encodeWithSelector(MercaInvoice.InvoiceNotPending.selector, INV_ID, MercaInvoice.Status.Paid)
        );
        invoice.payInvoice(INV_ID);
    }

    function test_PayInvoice_RevertIf_Expired() public {
        uint256 expiry = block.timestamp + 1 hours;

        vm.prank(merchant);
        invoice.createInvoice(INV_ID, address(0), AMOUNT, address(usdc), expiry, "");

        vm.warp(expiry + 1);
        assertTrue(invoice.isExpired(INV_ID));

        vm.prank(customer);
        vm.expectRevert(abi.encodeWithSelector(MercaInvoice.InvoiceExpiredError.selector, INV_ID));
        invoice.payInvoice(INV_ID);
    }

    // ─── cancelInvoice ────────────────────────────────────────────────────────

    function test_CancelInvoice_Success() public {
        vm.prank(merchant);
        invoice.createInvoice(INV_ID, address(0), AMOUNT, address(usdc), 0, "");

        vm.prank(merchant);
        invoice.cancelInvoice(INV_ID);

        assertEq(uint(invoice.getInvoice(INV_ID).status), uint(MercaInvoice.Status.Cancelled));
    }

    function test_CancelInvoice_RevertIf_NotMerchant() public {
        vm.prank(merchant);
        invoice.createInvoice(INV_ID, address(0), AMOUNT, address(usdc), 0, "");

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(MercaInvoice.NotMerchant.selector, INV_ID));
        invoice.cancelInvoice(INV_ID);
    }

    // ─── admin ────────────────────────────────────────────────────────────────

    function test_SetKYCContract() public {
        MercaKYC newKYC = new MercaKYC();
        vm.prank(owner);
        invoice.setKYC(address(newKYC));
        assertEq(address(invoice.kyc()), address(newKYC));
    }

    function test_SetWalletContract() public {
        MercaWallet newWallet = new MercaWallet();
        vm.prank(owner);
        invoice.setWallet(address(newWallet));
        assertEq(address(invoice.wallet()), address(newWallet));
    }

    function test_SetFee_RevertIf_TooHigh() public {
        vm.prank(owner);
        vm.expectRevert(MercaInvoice.FeeTooHigh.selector);
        invoice.setFee(1001, feeRecipient);
    }

    function test_Pause_BlocksCreateAndPay() public {
        vm.prank(owner);
        invoice.pause();

        vm.prank(merchant);
        vm.expectRevert();
        invoice.createInvoice(INV_ID, address(0), AMOUNT, address(usdc), 0, "");
    }

    // ─── Fuzz ─────────────────────────────────────────────────────────────────

    function testFuzz_PayInvoice_FeeAlwaysCorrect(uint256 amount, uint256 bps) public {
        amount = bound(amount, 1e6, 1_000_000e6);
        bps    = bound(bps, 0, 1000);

        vm.prank(owner);
        invoice.setFee(bps, feeRecipient);

        usdc.mint(customer, amount);

        vm.prank(merchant);
        invoice.createInvoice(INV_ID, address(0), amount, address(usdc), 0, "");

        vm.prank(customer);
        invoice.payInvoice(INV_ID);

        uint256 expectedFee      = (amount * bps) / 10_000;
        uint256 expectedMerchant = amount - expectedFee;

        assertEq(usdc.balanceOf(feeRecipient), expectedFee);
        assertEq(wallet.getBalance(merchant, address(usdc), 0), expectedMerchant);
    }
}
