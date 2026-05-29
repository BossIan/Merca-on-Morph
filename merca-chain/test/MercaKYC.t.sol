// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MercaKYC.sol";

contract MercaKYCTest is Test {
    MercaKYC public kyc;

    address owner    = makeAddr("owner");
    address operator = makeAddr("operator");
    address merchant = makeAddr("merchant");
    address customer = makeAddr("customer");
    address stranger = makeAddr("stranger");

    function setUp() public {
        vm.prank(owner);
        kyc = new MercaKYC();

        vm.prank(owner);
        kyc.setOperator(operator, true);
    }

    // ─── verifyAddress ────────────────────────────────────────────────────────

    function test_VerifyAddress_Basic() public {
        vm.prank(operator);
        kyc.verifyAddress(customer, MercaKYC.KYCLevel.Basic, 0);

        assertTrue(kyc.isVerified(customer));
        assertFalse(kyc.isMerchantVerified(customer));
    }

    function test_VerifyAddress_Full() public {
        vm.prank(operator);
        kyc.verifyAddress(merchant, MercaKYC.KYCLevel.Full, 0);

        assertTrue(kyc.isVerified(merchant));
        assertTrue(kyc.isMerchantVerified(merchant));
    }

    function test_VerifyAddress_WithExpiry() public {
        uint256 expiry = block.timestamp + 365 days;

        vm.prank(operator);
        kyc.verifyAddress(customer, MercaKYC.KYCLevel.Basic, expiry);

        assertTrue(kyc.isVerified(customer));

        vm.warp(expiry + 1);
        assertFalse(kyc.isVerified(customer));
        assertEq(uint(kyc.getLevel(customer)), uint(MercaKYC.KYCLevel.None));
    }

    function test_VerifyAddress_RevertIf_NotOperator() public {
        vm.prank(stranger);
        vm.expectRevert(MercaKYC.NotOperator.selector);
        kyc.verifyAddress(customer, MercaKYC.KYCLevel.Basic, 0);
    }

    function test_VerifyAddress_EmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit MercaKYC.AddressVerified(customer, MercaKYC.KYCLevel.Basic, 0);

        vm.prank(operator);
        kyc.verifyAddress(customer, MercaKYC.KYCLevel.Basic, 0);
    }

    // ─── verifyBatch ──────────────────────────────────────────────────────────

    function test_VerifyBatch() public {
        address[] memory accounts = new address[](3);
        accounts[0] = makeAddr("a1");
        accounts[1] = makeAddr("a2");
        accounts[2] = makeAddr("a3");

        vm.prank(operator);
        kyc.verifyBatch(accounts, MercaKYC.KYCLevel.Basic, 0);

        for (uint i = 0; i < accounts.length; i++) {
            assertTrue(kyc.isVerified(accounts[i]));
        }
    }

    function test_VerifyBatch_Full() public {
        address[] memory accounts = new address[](2);
        accounts[0] = makeAddr("m1");
        accounts[1] = makeAddr("m2");

        vm.prank(operator);
        kyc.verifyBatch(accounts, MercaKYC.KYCLevel.Full, 0);

        for (uint i = 0; i < accounts.length; i++) {
            assertTrue(kyc.isMerchantVerified(accounts[i]));
        }
    }

    // ─── revokeAddress ────────────────────────────────────────────────────────

    function test_RevokeAddress() public {
        vm.prank(operator);
        kyc.verifyAddress(customer, MercaKYC.KYCLevel.Basic, 0);
        assertTrue(kyc.isVerified(customer));

        vm.prank(operator);
        kyc.revokeAddress(customer);
        assertFalse(kyc.isVerified(customer));
        assertEq(uint(kyc.getLevel(customer)), uint(MercaKYC.KYCLevel.None));
    }

    function test_RevokeAddress_EmitsEvent() public {
        vm.prank(operator);
        kyc.verifyAddress(customer, MercaKYC.KYCLevel.Basic, 0);

        vm.expectEmit(true, false, false, false);
        emit MercaKYC.AddressRevoked(customer);

        vm.prank(operator);
        kyc.revokeAddress(customer);
    }

    // ─── setSuspended ─────────────────────────────────────────────────────────

    function test_SuspendAddress() public {
        vm.prank(operator);
        kyc.verifyAddress(customer, MercaKYC.KYCLevel.Basic, 0);

        vm.prank(operator);
        kyc.setSuspended(customer, true);

        assertFalse(kyc.isVerified(customer));
        assertEq(uint(kyc.getLevel(customer)), uint(MercaKYC.KYCLevel.None));
    }

    function test_UnsuspendAddress() public {
        vm.prank(operator);
        kyc.verifyAddress(customer, MercaKYC.KYCLevel.Basic, 0);

        vm.prank(operator);
        kyc.setSuspended(customer, true);
        assertFalse(kyc.isVerified(customer));

        vm.prank(operator);
        kyc.setSuspended(customer, false);
        assertTrue(kyc.isVerified(customer));
    }

    // ─── operators ────────────────────────────────────────────────────────────

    function test_OwnerCanVerify() public {
        vm.prank(owner);
        kyc.verifyAddress(merchant, MercaKYC.KYCLevel.Full, 0);
        assertTrue(kyc.isMerchantVerified(merchant));
    }

    function test_SetOperator() public {
        address newOp = makeAddr("newOp");
        assertFalse(kyc.operators(newOp));

        vm.prank(owner);
        kyc.setOperator(newOp, true);
        assertTrue(kyc.operators(newOp));
    }

    function test_RevokeOperator() public {
        vm.prank(owner);
        kyc.setOperator(operator, false);

        vm.prank(operator);
        vm.expectRevert(MercaKYC.NotOperator.selector);
        kyc.verifyAddress(customer, MercaKYC.KYCLevel.Basic, 0);
    }

    function test_Pause_BlocksVerify() public {
        vm.prank(owner);
        kyc.pause();

        vm.prank(operator);
        vm.expectRevert();
        kyc.verifyAddress(customer, MercaKYC.KYCLevel.Basic, 0);
    }

    // ─── Fuzz ─────────────────────────────────────────────────────────────────

    function testFuzz_ExpiryBoundary(uint256 secondsUntilExpiry) public {
        secondsUntilExpiry = bound(secondsUntilExpiry, 1, 365 days * 10);
        uint256 expiry = block.timestamp + secondsUntilExpiry;

        vm.prank(operator);
        kyc.verifyAddress(customer, MercaKYC.KYCLevel.Basic, expiry);

        assertTrue(kyc.isVerified(customer));

        vm.warp(expiry + 1);
        assertFalse(kyc.isVerified(customer));
    }
}
