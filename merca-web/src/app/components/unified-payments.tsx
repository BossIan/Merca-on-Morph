"use client";

import { useNavigate } from "react-router";
import { ArrowLeft, Wallet, CreditCard, Banknote, Coins, CheckCircle, Info, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useMercaWallet } from "../../hooks/useMercaWallet";

export function UnifiedPayments() {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState("all");
  const { isConnected } = useAccount();
  const { totalBalance, wallet0Balance } = useMercaWallet();

  // Real on-chain data
  const stablecoinBalance = parseFloat(totalBalance.replace(/,/g, ""));

  const paymentMethods = [
    {
      id: "stablecoins",
      name: "Stablecoins",
      icon: Coins,
      balance: stablecoinBalance,
      transactions: null, // ⚠️ TODO: from backend
      color: "#328100",
      methods: ["USDC", "USDT", "DAI"],
      live: true,
    },
   
  ];

  const totalAcrossAll = paymentMethods.reduce((sum, m) => sum + m.balance, 0);

  const filteredMethods = selectedMethod === "all"
    ? paymentMethods
    : paymentMethods.filter((m) => m.id === selectedMethod);

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] pb-6">
      <div className="bg-white px-6 pt-12 pb-6 rounded-b-3xl shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/dashboard")} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-[#1F1F1F]" />
          </button>
          <h2 className="font-bold text-[#1F1F1F]">Unified Payments</h2>
          <div className="w-10" />
        </div>

        {/* Total balance card */}
        <div className="bg-gradient-to-br from-[#328100] to-[#2a6e00] rounded-2xl p-6 text-white mb-4">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm opacity-90 mb-1">Total Across All Channels</p>
              <h1 className="text-4xl font-bold mb-1">
                {isConnected
                  ? `$${totalAcrossAll.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "$0.00"}
              </h1>
              {/* ⚠️ TODO: Replace with real transaction count from backend */}
              <p className="text-sm opacity-75">— payments this month</p>
            </div>
            <div className="bg-white/20 p-2 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-3 flex items-center gap-2">
            <Info className="w-4 h-4" />
            <p className="text-sm">All payments settle to one balance instantly</p>
          </div>
        </div>
      </div>

      {/* No fragmentation banner */}
      <div className="px-6 mb-6">
        <div className="bg-[#E8F5E0] border-2 border-[#328100] rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-[#328100] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-[#328100] mb-1">No More Fragmentation</p>
            <p className="text-sm text-[#1F1F1F]">
              Accept payments from any source — all in one dashboard. No need to check multiple apps.
            </p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="px-6 mb-4">
        <h3 className="font-bold text-[#1F1F1F] mb-3">Payment Channels</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedMethod("all")}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
              selectedMethod === "all"
                ? "bg-[#328100] text-white"
                : "bg-white text-[#6B6B6B]"
            }`}
          >
            All Channels
          </button>
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
                selectedMethod === method.id
                  ? "bg-[#328100] text-white"
                  : "bg-white text-[#6B6B6B]"
              }`}
            >
              {method.name}
            </button>
          ))}
        </div>
      </div>

      {/* Payment method cards */}
      <div className="px-6 space-y-3">
        {filteredMethods.map((method) => {
          const Icon = method.icon;
          return (
            <div key={method.id} className="bg-white rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${method.color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: method.color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#1F1F1F]">{method.name}</h4>
                      {method.live ? (
                        <span className="text-xs bg-[#E8F5E0] text-[#328100] px-2 py-0.5 rounded-full font-medium">
                          live
                        </span>
                      ) : (
                        <span className="text-xs bg-[#F5F5F5] text-[#6B6B6B] px-2 py-0.5 rounded-full">
                          pending backend
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#6B6B6B]">
                      {/* ⚠️ TODO: Replace with real tx count from backend */}
                      {method.live
                        ? isConnected ? "On-chain · Morph Hoodi" : "Connect wallet"
                        : "— pending backend —"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {method.live && !isConnected ? (
                    <p className="text-sm text-[#6B6B6B]">—</p>
                  ) : (
                    <p className="font-bold text-xl text-[#1F1F1F]">
                      {method.live
                        ? `$${method.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "— pending backend —"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {method.methods.map((m) => (
                  <span
                    key={m}
                    className="px-3 py-1 bg-[#F5F5F5] rounded-lg text-sm text-[#6B6B6B]"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
