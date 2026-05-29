"use client";

import { useNavigate } from "react-router";
import { ArrowLeft, ArrowUpRight, Coins, Plus, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useMercaWallet } from "../../hooks/useMercaWallet";
import { ConnectWallet } from "./ConnectWallet";

export function Wallet() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const {
    totalBalance, wallet0Balance, wallet0BalanceRaw,
    usdcBalance, walletCount, withdrawAll, isTxPending, txHash, refetch,
  } = useMercaWallet();

  const [withdrawError,  setWithdrawError]  = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  async function handleWithdrawAll() {
    if (wallet0BalanceRaw === 0n) {
      setWithdrawError("No balance to withdraw");
      return;
    }
    setWithdrawError("");
    setWithdrawSuccess(false);
    try {
      await withdrawAll();
      setWithdrawSuccess(true);
      setTimeout(() => { setWithdrawSuccess(false); refetch(); }, 3000);
    } catch (err: any) {
      setWithdrawError(err?.shortMessage ?? err?.message ?? "Withdraw failed");
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] pb-24">
      <div className="bg-white px-6 pt-12 pb-6 rounded-b-3xl shadow-sm mb-6">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate("/dashboard")} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-[#1F1F1F]" />
          </button>
          <h2 className="font-bold text-[#1F1F1F]">My Wallets</h2>
          <button className="p-2">
            <Plus className="w-6 h-6 text-[#328100]" />
          </button>
        </div>

        <div className="bg-gradient-to-br from-[#328100] to-[#2a6e00] rounded-2xl p-6 text-white">
          <p className="text-sm opacity-90 mb-1">Total Balance (USDC)</p>
          <h1 className="text-4xl font-bold mb-4">
            {isConnected ? `$${totalBalance}` : "$0.00"}
          </h1>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
              <span>Morph Hoodi</span>
            </div>
            <span className="opacity-75">testnet</span>
          </div>
        </div>
      </div>

      {!isConnected && (
        <div className="px-6 mb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-amber-800 mb-2">Connect your wallet to view balances</p>
              <ConnectWallet />
            </div>
          </div>
        </div>
      )}

      <div className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#1F1F1F]">All Wallets</h3>
        </div>

        <div className="space-y-3">
          {/* Default USDC wallet (wallet 0) */}
          <div className="bg-white rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-[#1F1F1F]">USDC Wallet</h4>
                  <p className="text-sm text-[#6B6B6B]">Default · Wallet 0</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-xl text-[#1F1F1F]">
                  ${isConnected ? wallet0Balance : "0.00"}
                </p>
                <p className="text-xs text-[#6B6B6B]">settled balance</p>
              </div>
            </div>

            {withdrawError && (
              <div className="mb-3 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-700">{withdrawError}</p>
              </div>
            )}

            {withdrawSuccess && (
              <div className="mb-3 bg-[#E8F5E0] border border-[#328100]/20 rounded-xl p-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#328100] flex-shrink-0" />
                <p className="text-xs text-[#328100]">Withdrawal successful!</p>
              </div>
            )}

            {txHash && isTxPending && (
              <div className="mb-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                <a
                  href={`https://explorer-hoodi.morphl2.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline"
                >
                  View transaction on Morph Explorer →
                </a>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleWithdrawAll}
                disabled={!isConnected || isTxPending || wallet0BalanceRaw === 0n}
                className="flex-1 py-2.5 bg-[#328100] text-white rounded-xl font-medium hover:bg-[#2a6e00] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isTxPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Withdrawing...</>
                ) : (
                  <><ArrowUpRight className="w-4 h-4" /> Withdraw All</>
                )}
              </button>
              <button className="flex-1 py-2.5 bg-[#F5F5F5] text-[#1F1F1F] rounded-xl font-medium">
                Details
              </button>
            </div>
          </div>

          {/* USDC in wallet card */}
          <div className="bg-white rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-[#1F1F1F]">USDC in Wallet</h4>
                  <p className="text-sm text-[#6B6B6B]">Available to spend</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-xl text-[#1F1F1F]">
                  ${isConnected ? usdcBalance : "0.00"}
                </p>
                <p className="text-xs text-[#6B6B6B]">wallet balance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet count info */}
        {isConnected && walletCount > 0 && (
          <div className="mt-4 bg-[#E8F5E0] rounded-xl p-4">
            <p className="text-sm text-[#328100]">
              You have {walletCount} sub-wallet{walletCount !== 1 ? "s" : ""} on Morph
            </p>
          </div>
        )}

        {/* Withdrawal info */}
        <div className="mt-6 bg-white rounded-2xl p-5">
          <h4 className="font-bold text-[#1F1F1F] mb-3">Withdrawal Options</h4>
          <div className="space-y-2 text-sm text-[#6B6B6B]">
            <div className="flex justify-between">
              <span>Crypto Wallet (on-chain)</span>
              <span className="text-[#328100]">Instant</span>
            </div>
            <div className="flex justify-between">
              <span>Network</span>
              <span className="text-[#1F1F1F]">Morph Hoodi</span>
            </div>
            <div className="flex justify-between">
              <span>Token</span>
              <span className="text-[#1F1F1F]">USDC</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
