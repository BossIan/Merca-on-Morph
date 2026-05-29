"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet, LogOut, ChevronDown } from "lucide-react";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-[#E8F5E0] px-3 py-2 rounded-xl">
          <div className="w-2 h-2 bg-[#328100] rounded-full" />
          <span className="text-sm font-medium text-[#328100]">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="p-2 hover:bg-[#F5F5F5] rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4 text-[#6B6B6B]" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      disabled={isPending}
      className="flex items-center gap-2 bg-[#328100] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#2a6e00] transition-colors disabled:opacity-50"
    >
      <Wallet className="w-4 h-4" />
      {isPending ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
