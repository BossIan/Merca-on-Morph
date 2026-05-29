// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MercaKYC.sol";
import "../src/MercaWallet.sol";

contract DeployMerca is Script {
    // ── paste your Day 1 contract address here ──
    address constant MERCA_INVOICE = 0xb9217baf4BFA6BBb49aD16FB9b3f29643597e9AE;
    address constant USDC          = 0x7433b41C6c5e1d58D4Da99483609520255ab661B;

    function run() external {
        vm.startBroadcast();

        // 1. Deploy KYC
        MercaKYC kyc = new MercaKYC();
        console.log("MercaKYC deployed at:    ", address(kyc));

        // 2. Deploy Wallet
        MercaWallet wallet = new MercaWallet();
        console.log("MercaWallet deployed at: ", address(wallet));

        // 3. Whitelist USDC on wallet
        wallet.setAcceptedToken(USDC, true);

        // 4. Authorize MercaInvoice as a settler
        wallet.setSettler(MERCA_INVOICE, true);

        // 5. Verify deployer as KYC operator (so backend can call verifyAddress)
        // kyc.setOperator(YOUR_BACKEND_WALLET, true);

        vm.stopBroadcast();

        console.log("---");
        console.log("Add to .env:");
        console.log("MERCA_KYC=", address(kyc));
        console.log("MERCA_WALLET=", address(wallet));
    }
}
