"use client";

import { useNavigate } from "react-router";
import {
  ArrowDownLeft, QrCode, FileText,
  Menu, TrendingUp, Zap, Layers, Info, Wallet, User, Loader2,
} from "lucide-react";
import { useAccount } from "wagmi";
import { useMercaWallet } from "../../hooks/useMercaWallet";
import { useMercaTransactions } from "../../hooks/useMercaTransactions";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useInvoicePaidWatcher } from "../../hooks/useInvoicePaidWatcher";
import { NotificationToast } from "./NotificationToast";
import { ConnectWallet } from "./ConnectWallet";
import { useNotifications } from "../../hooks/useNotifications";
import { Bell } from "lucide-react";
export function Dashboard() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { totalBalance } = useMercaWallet();
  const { transactions, isLoading } = useMercaTransactions();
  const { isChecking, isAuthorized } = useAuthGuard();
  const { unreadCount } = useNotifications(); 
  useInvoicePaidWatcher();

  const recentTxs = transactions.slice(0, 3);

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-[#328100] animate-spin" />
        <p className="text-sm text-[#6B6B6B]">Verifying account...</p>
      </div>
    );
  }

  // Not authorized — useAuthGuard already redirected, but just in case
  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] pb-24">
      <NotificationToast />
      {/* Top card */}
      <div className="bg-white px-6 pt-12 pb-6 rounded-b-3xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <span className="text-2xl font-bold text-[#328100]">merca.</span>
          <div className="flex items-center gap-2">
            <ConnectWallet />
            <button onClick={() => navigate("/notifications")} className="p-2 relative">
              <Bell className="w-6 h-6 text-[#1F1F1F]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => navigate("/profile")} className="p-2">
              <Menu className="w-6 h-6 text-[#1F1F1F]" />
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#328100] to-[#2a6e00] rounded-2xl p-6 text-white">
          <p className="text-sm opacity-90 mb-1">Total Balance</p>
          <h1 className="text-4xl font-bold mb-4">
            {isConnected ? `$${totalBalance}` : "$0.00"}
          </h1>
          {isConnected ? (
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                <TrendingUp className="w-4 h-4" />
                <span>USDC</span>
              </div>
              <span className="opacity-75">on Morph Hoodi</span>
            </div>
          ) : (
            <p className="text-sm opacity-75">Connect wallet to view balance</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-[#E8F5E0] rounded-xl p-4">
            <p className="text-sm text-[#328100] mb-1">Network</p>
            <p className="text-sm font-bold text-[#1F1F1F]">Morph Hoodi</p>
          </div>
          <div className="bg-[#E8F5E0] rounded-xl p-4">
            <div className="flex items-center gap-1 mb-1">
              <Zap className="w-4 h-4 text-[#328100]" />
              <p className="text-sm text-[#328100]">Settlement</p>
            </div>
            <p className="text-sm font-bold text-[#1F1F1F]">Instant</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 mt-6 space-y-3">
        <button
          onClick={() => navigate("/qr-payment")}
          className="w-full py-4 bg-[#328100] text-white rounded-2xl font-medium hover:bg-[#2a6e00] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#328100]/20"
        >
          <QrCode className="w-5 h-5" />
          Receive Payment
        </button>
        <button
          onClick={() => navigate("/unified-payments")}
          className="w-full py-3.5 bg-white border-2 border-[#328100] text-[#328100] rounded-2xl font-medium hover:bg-[#E8F5E0] transition-colors flex items-center justify-center gap-2"
        >
          <Layers className="w-5 h-5" />
          View All Payment Channels
        </button>
      </div>

      {/* How it works */}
      <div className="px-6 mt-6">
        <button
          onClick={() => navigate("/how-it-works")}
          className="w-full bg-gradient-to-r from-[#E8F5E0] to-[#F5F5F5] rounded-2xl p-4 flex items-start gap-3 border border-[#328100]/20"
        >
          <div className="bg-white rounded-xl p-2 flex-shrink-0">
            <Info className="w-5 h-5 text-[#328100]" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-[#1F1F1F] mb-1">How It Works</h4>
            <p className="text-sm text-[#6B6B6B] mb-2">
              Accept payments from any currency — all settle to one balance instantly
            </p>
            <div className="flex items-center gap-2 text-xs text-[#328100]">
              <Zap className="w-3 h-3" />
              <span>No waiting • No fragmentation • Full transparency</span>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Transactions */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#1F1F1F]">Recent Transactions</h3>
          <button
            onClick={() => navigate("/invoice-list")}
            className="text-sm text-[#328100] font-medium"
          >
            View All
          </button>
        </div>

        {!isConnected && (
          <div className="bg-white rounded-xl p-6 text-center text-[#6B6B6B] text-sm">
            Connect wallet to see transactions
          </div>
        )}

        {isConnected && isLoading && (
          <div className="bg-white rounded-xl p-6 text-center text-[#6B6B6B] text-sm">
            Loading transactions...
          </div>
        )}

        {isConnected && !isLoading && recentTxs.length === 0 && (
          <div className="bg-white rounded-xl p-6 text-center text-[#6B6B6B] text-sm">
            No transactions yet
          </div>
        )}

        {isConnected && !isLoading && recentTxs.length > 0 && (
          <div className="space-y-3">
            {recentTxs.map((tx) => (
              <div key={tx.id} className="bg-white rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E8F5E0] flex items-center justify-center">
                    <ArrowDownLeft className="w-5 h-5 text-[#328100]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1F1F1F] text-sm">
                      {tx.payer.slice(0, 6)}...{tx.payer.slice(-4)}
                    </p>
                    <p className="text-xs text-[#6B6B6B]">
                      {tx.timestamp ? tx.timestamp.toLocaleDateString() : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#1F1F1F]">${tx.net}</p>
                  <p className="text-xs text-[#328100]">completed</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E5E5] px-6 py-4">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-[#E8F5E0] rounded-xl flex items-center justify-center">
              <Menu className="w-5 h-5 text-[#328100]" />
            </div>
            <span className="text-xs text-[#328100]">Home</span>
          </button>
          <button onClick={() => navigate("/wallet")} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#6B6B6B]" />
            </div>
            <span className="text-xs text-[#6B6B6B]">Wallets</span>
          </button>
          <button onClick={() => navigate("/invoice-list")} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#6B6B6B]" />
            </div>
            <span className="text-xs text-[#6B6B6B]">Invoices</span>
          </button>
          <button onClick={() => navigate("/profile")} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-[#6B6B6B]" />
            </div>
            <span className="text-xs text-[#6B6B6B]">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
