// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MercaWallet.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract MercaWalletTest is Test {
    MercaWallet public wallet;
    MockUSDC    public usdc;

    address owner    = makeAddr("owner");
    address settler  = makeAddr("settler");
    address merchant = makeAddr("merchant");
    address stranger = makeAddr("stranger");

    uint256 constant AMOUNT = 100e6;

    function setUp() public {
        vm.startPrank(owner);
        wallet = new MercaWallet();
        usdc   = new MockUSDC();
        wallet.setSettler(settler, true);
        wallet.setAcceptedToken(address(usdc), true);
        vm.stopPrank();

        usdc.mint(settler, 10_000e6);
        vm.prank(settler);
        usdc.approve(address(wallet), type(uint256).max);
    }

    // helper: settle into merchant default wallet (auto-creates ID 0)
    function _settle(uint256 amount) internal {
        vm.prank(settler);
        wallet.settle(merchant, address(usdc), 0, amount);
    }

    // ─── createSubWallet ──────────────────────────────────────────────────────

    function test_CreateSubWallet() public {
        vm.prank(merchant);
        uint256 id = wallet.createSubWallet("main", merchant);

        assertEq(id, 0);
        MercaWallet.SubWallet memory w = wallet.getSubWallet(merchant, 0);
        assertEq(w.name, "main");
        assertEq(w.withdrawTo, merchant);
        assertTrue(w.active);
    }

    function test_CreateMultipleSubWallets() public {
        vm.startPrank(merchant);
        wallet.createSubWallet("main",    merchant);
        wallet.createSubWallet("savings", makeAddr("savings"));
        wallet.createSubWallet("tax",     makeAddr("tax"));
        vm.stopPrank();

        assertEq(wallet.walletCount(merchant), 3);
    }

    function test_CreateSubWallet_EmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit MercaWallet.SubWalletCreated(merchant, 0, "main", merchant);

        vm.prank(merchant);
        wallet.createSubWallet("main", merchant);
    }

    // ─── updateSubWallet ──────────────────────────────────────────────────────

    function test_UpdateSubWallet() public {
        vm.prank(merchant);
        wallet.createSubWallet("main", merchant);

        address newAddr = makeAddr("newAddr");
        vm.prank(merchant);
        wallet.updateSubWallet(0, newAddr);

        MercaWallet.SubWallet memory w = wallet.getSubWallet(merchant, 0);
        assertEq(w.withdrawTo, newAddr);
    }

    // ─── settle ───────────────────────────────────────────────────────────────

    function test_Settle_AutoCreatesDefaultWallet() public {
        assertEq(wallet.walletCount(merchant), 0);
        _settle(AMOUNT);
        assertEq(wallet.walletCount(merchant), 1);
        assertEq(wallet.getBalance(merchant, address(usdc), 0), AMOUNT);
    }

    function test_Settle_AccumulatesBalance() public {
        _settle(AMOUNT);
        _settle(AMOUNT);
        assertEq(wallet.getBalance(merchant, address(usdc), 0), AMOUNT * 2);
    }

    function test_Settle_EmitsEvent() public {
        // pre-create wallet so auto-create doesn't fire and muddy the emit check
        vm.prank(merchant);
        wallet.createSubWallet("main", merchant);

        vm.expectEmit(true, true, true, true);
        emit MercaWallet.Settled(merchant, address(usdc), 0, AMOUNT, settler);

        vm.prank(settler);
        wallet.settle(merchant, address(usdc), 0, AMOUNT);
    }

    function test_Settle_RevertIf_NotSettler() public {
        vm.prank(merchant);
        wallet.createSubWallet("main", merchant);

        vm.prank(stranger);
        vm.expectRevert(MercaWallet.NotSettler.selector);
        wallet.settle(merchant, address(usdc), 0, AMOUNT);
    }

    function test_Settle_RevertIf_TokenNotAccepted() public {
        address fakeToken = makeAddr("fakeToken");
        vm.prank(settler);
        vm.expectRevert(
            abi.encodeWithSelector(MercaWallet.TokenNotAccepted.selector, fakeToken)
        );
        wallet.settle(merchant, fakeToken, 0, AMOUNT);
    }

    function test_Settle_RevertIf_ZeroAmount() public {
        vm.prank(settler);
        vm.expectRevert(MercaWallet.InvalidAmount.selector);
        wallet.settle(merchant, address(usdc), 0, 0);
    }

    // ─── withdraw ─────────────────────────────────────────────────────────────

    function test_Withdraw_Success() public {
        _settle(AMOUNT);

        vm.prank(merchant);
        wallet.withdraw(address(usdc), 0, AMOUNT);

        assertEq(usdc.balanceOf(merchant), AMOUNT);
        assertEq(wallet.getBalance(merchant, address(usdc), 0), 0);
    }

    function test_Withdraw_Partial() public {
        _settle(AMOUNT);

        vm.prank(merchant);
        wallet.withdraw(address(usdc), 0, 40e6);

        assertEq(usdc.balanceOf(merchant), 40e6);
        assertEq(wallet.getBalance(merchant, address(usdc), 0), 60e6);
    }

    function test_Withdraw_MaxAmount() public {
        _settle(AMOUNT);

        vm.prank(merchant);
        wallet.withdraw(address(usdc), 0, type(uint256).max);

        assertEq(usdc.balanceOf(merchant), AMOUNT);
    }

    function test_Withdraw_ToDifferentAddress() public {
        address payoutAddr = makeAddr("payout");

        // settle creates wallet 0 (default)
        _settle(AMOUNT);

        // create wallet 1 pointing to payoutAddr
        vm.prank(merchant);
        wallet.createSubWallet("payout", payoutAddr);

        // move funds from wallet 0 → wallet 1
        vm.prank(merchant);
        wallet.moveBalance(address(usdc), 0, 1, AMOUNT);

        // withdraw from wallet 1 → goes to payoutAddr
        vm.prank(merchant);
        wallet.withdraw(address(usdc), 1, AMOUNT);

        assertEq(usdc.balanceOf(payoutAddr), AMOUNT);
        assertEq(usdc.balanceOf(merchant), 0);
    }

    function test_Withdraw_RevertIf_InsufficientBalance() public {
        _settle(AMOUNT);

        vm.prank(merchant);
        vm.expectRevert(
            abi.encodeWithSelector(MercaWallet.InsufficientBalance.selector, AMOUNT, AMOUNT + 1)
        );
        wallet.withdraw(address(usdc), 0, AMOUNT + 1);
    }

    function test_Withdraw_RevertIf_WalletInactive() public {
        vm.prank(merchant);
        wallet.createSubWallet("temp", merchant);

        vm.prank(merchant);
        wallet.deactivateSubWallet(0, address(usdc));

        vm.prank(merchant);
        vm.expectRevert(abi.encodeWithSelector(MercaWallet.WalletInactive.selector, 0));
        wallet.withdraw(address(usdc), 0, AMOUNT);
    }

    // ─── moveBalance ──────────────────────────────────────────────────────────

    function test_MoveBalance() public {
        // settle creates wallet 0
        _settle(AMOUNT);

        // create wallet 1
        vm.prank(merchant);
        wallet.createSubWallet("savings", makeAddr("savings"));

        vm.prank(merchant);
        wallet.moveBalance(address(usdc), 0, 1, 50e6);

        assertEq(wallet.getBalance(merchant, address(usdc), 0), 50e6);
        assertEq(wallet.getBalance(merchant, address(usdc), 1), 50e6);
    }

    function test_MoveBalance_RevertIf_Insufficient() public {
        _settle(AMOUNT);

        vm.prank(merchant);
        wallet.createSubWallet("savings", makeAddr("savings"));

        vm.prank(merchant);
        vm.expectRevert(
            abi.encodeWithSelector(MercaWallet.InsufficientBalance.selector, AMOUNT, AMOUNT + 1)
        );
        wallet.moveBalance(address(usdc), 0, 1, AMOUNT + 1);
    }

    // ─── getTotalBalance ──────────────────────────────────────────────────────

    function test_GetTotalBalance_AcrossWallets() public {
        _settle(AMOUNT);
        _settle(AMOUNT);

        // create wallet 1
        vm.prank(merchant);
        wallet.createSubWallet("savings", makeAddr("savings"));

        vm.prank(merchant);
        wallet.moveBalance(address(usdc), 0, 1, 50e6);

        assertEq(wallet.getTotalBalance(merchant, address(usdc)), AMOUNT * 2);
    }

    // ─── admin ────────────────────────────────────────────────────────────────

    function test_SetSettler() public {
        address newSettler = makeAddr("newSettler");
        assertFalse(wallet.settlers(newSettler));

        vm.prank(owner);
        wallet.setSettler(newSettler, true);
        assertTrue(wallet.settlers(newSettler));
    }

    function test_RevokeSettler() public {
        vm.prank(owner);
        wallet.setSettler(settler, false);

        vm.prank(merchant);
        wallet.createSubWallet("main", merchant);

        vm.prank(settler);
        vm.expectRevert(MercaWallet.NotSettler.selector);
        wallet.settle(merchant, address(usdc), 0, AMOUNT);
    }

    function test_Pause_BlocksSettle() public {
        // create wallet first, then pause
        vm.prank(merchant);
        wallet.createSubWallet("main", merchant);

        vm.prank(owner);
        wallet.pause();

        vm.prank(settler);
        vm.expectRevert();
        wallet.settle(merchant, address(usdc), 0, AMOUNT);
    }

    // ─── Fuzz ─────────────────────────────────────────────────────────────────

    function testFuzz_SettleAndWithdraw(uint256 amount) public {
        amount = bound(amount, 1e6, 1_000_000e6);
        usdc.mint(settler, amount);

        vm.prank(settler);
        wallet.settle(merchant, address(usdc), 0, amount);

        vm.prank(merchant);
        wallet.withdraw(address(usdc), 0, amount);

        assertEq(usdc.balanceOf(merchant), amount);
        assertEq(wallet.getBalance(merchant, address(usdc), 0), 0);
    }

    function testFuzz_MoveBalance_NeverExceedsTotal(uint256 amount, uint256 moveAmount) public {
        amount     = bound(amount, 1e6, 1_000_000e6);
        moveAmount = bound(moveAmount, 0, amount);
        usdc.mint(settler, amount);

        // settle creates wallet 0
        vm.prank(settler);
        wallet.settle(merchant, address(usdc), 0, amount);

        // create wallet 1
        vm.prank(merchant);
        wallet.createSubWallet("savings", makeAddr("savings"));

        vm.prank(merchant);
        wallet.moveBalance(address(usdc), 0, 1, moveAmount);

        assertEq(wallet.getTotalBalance(merchant, address(usdc)), amount);
    }
}
