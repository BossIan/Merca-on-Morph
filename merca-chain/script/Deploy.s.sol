// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MercaInvoice.sol";

/**
 * @notice Redeploy MercaInvoice with KYC + Wallet wired in (Day 3).
 *         Run after DeployMerca.s.sol (KYC + Wallet already deployed).
 */
contract Deploy is Script {
    // ── existing contracts from Day 2 ──
    address constant MERCA_KYC    = 0x7affF4B529C13794BF2A5Af134A2420003D5058E;
    address constant MERCA_WALLET = 0x5083D82F7Da5B31188c17191059956143ed1A7A0;
    address constant USDC         = 0x7433b41C6c5e1d58D4Da99483609520255ab661B;
    address constant FEE_RECIPIENT = 0x949e35a7464c9f39E9341E4F4eAE3460F50D5aF1;
    uint256 constant FEE_BPS      = 50;

    function run() external {
        vm.startBroadcast();

        // 1. Deploy updated MercaInvoice with KYC + Wallet
        MercaInvoice invoice = new MercaInvoice(
            FEE_RECIPIENT,
            FEE_BPS,
            MERCA_KYC,
            MERCA_WALLET
        );
        console.log("MercaInvoice deployed at:", address(invoice));

        // 2. Whitelist USDC
        invoice.setAcceptedToken(USDC, true);

        // 3. Authorize new invoice as settler on wallet
        //    NOTE: must call wallet.setSettler(address(invoice), true) separately
        //    if you don't own the wallet deployer key in this script
        console.log("---");
        console.log("Next: authorize invoice as settler on wallet:");
        console.log("New invoice address:");
        console.log(address(invoice));

        vm.stopBroadcast();

        console.log("Add to .env:");
        console.log("MERCA_INVOICE=", address(invoice));
    }
}
