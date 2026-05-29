"use client";

import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Send, Info, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useAccount } from "wagmi";
import { useMercaInvoice } from "../../hooks/useMercaInvoice";
import { ConnectWallet } from "./ConnectWallet";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function Invoice() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { createInvoice, isTxPending, isTxSuccess, txHash } = useMercaInvoice();

  const [customerName,  setCustomerName]  = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [amount,        setAmount]        = useState("");
  const [description,   setDescription]  = useState("");
  const [dueDate,       setDueDate]       = useState("");
  const [currency,      setCurrency]      = useState("USDC");
  const [currencyType,  setCurrencyType]  = useState<"crypto" | "fiat">("crypto");
  const [error,         setError]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [lastInvoiceId, setLastInvoiceId] = useState("");
  const [done,          setDone]          = useState(false);

  const cryptoCurrencies = ["USDC", "USDT", "DAI"];
  const fiatCurrencies   = ["USD", "EUR", "GBP", "NGN"];

  const fee   = amount ? (parseFloat(amount) * 0.005).toFixed(2) : "0.00";
  const total = amount ? (parseFloat(amount) * 1.005).toFixed(2) : "0.00";

  async function handleSendInvoice() {
    if (!customerName || !customerEmail) {
      setError("Please fill in customer name and email");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (!description) {
      setError("Please enter a description");
      return;
    }
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // ── Step 1: Save customer info to backend ──────────────────────────────
      const token = localStorage.getItem("token");
      const backendRes = await fetch(`${API_URL}/api/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customer_name:  customerName,
          customer_email: customerEmail,
          amount:         parseFloat(amount),
          description,
          currency,
          due_date:       dueDate,
        }),
      });

      const backendData = await backendRes.json();

      if (!backendRes.ok) {
        setError(backendData.message || "Failed to save invoice to server");
        setLoading(false);
        return;
      }

      const backendInvoiceId = backendData.id;

      // ── Step 2: Create invoice on-chain (Morph) ────────────────────────────
      const { hash, invoiceId: onChainId } = await createInvoice({
        amount,
        description: `${description} — ${customerName}`,
        dueDate,
      });

      setLastInvoiceId(onChainId);

      await fetch(`${API_URL}/api/invoices/${backendInvoiceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ on_chain_id: onChainId }),
      });

      setDone(true);
    } catch (err: any) {
      setError(err?.shortMessage ?? err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (done && lastInvoiceId) {
    return (
      <div className="min-h-screen w-full bg-[#FAFAFA] flex flex-col items-center justify-center px-6">
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-[#E8F5E0] rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#328100]" />
          </div>
          <h2 className="text-xl font-bold text-[#1F1F1F] mb-2">Invoice Created!</h2>
          <p className="text-sm text-[#6B6B6B] mb-4">
            Saved to your account and live on Morph.
          </p>

          {/* Payment link */}
          <div className="bg-[#F5F5F5] rounded-xl p-3 mb-4 text-left">
            <p className="text-xs text-[#6B6B6B] mb-1">Payment Link</p>
            <p className="text-xs font-mono text-[#1F1F1F] break-all">
              {window.location.origin}/pay/{lastInvoiceId}
            </p>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/pay/${lastInvoiceId}`
              );
            }}
            className="w-full py-2.5 mb-3 bg-white border-2 border-[#328100] text-[#328100] rounded-xl font-medium text-sm"
          >
            Copy Payment Link
          </button>

          {txHash && (
            <a
              href={`https://explorer-hoodi.morphl2.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#328100] underline block mb-4"
            >
              View on Morph Explorer →
            </a>
          )}

          <button
            onClick={() => navigate("/invoice-list")}
            className="w-full py-3 bg-[#328100] text-white rounded-xl font-medium"
          >
            View All Invoices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] pb-24">
      <div className="bg-white px-6 pt-12 pb-6 rounded-b-3xl shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/dashboard")} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-[#1F1F1F]" />
          </button>
          <h2 className="font-bold text-[#1F1F1F]">Create Invoice</h2>
          <div className="w-10" />
        </div>
      </div>

      {!isConnected && (
        <div className="px-6 mb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-amber-800 mb-2">
                Connect your wallet to create invoices on-chain
              </p>
              <ConnectWallet />
            </div>
          </div>
        </div>
      )}

      <div className="px-6 space-y-4">
        <div className="bg-[#E8F5E0] rounded-xl p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-[#328100] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#1F1F1F]">
            Customer can pay in any currency — settles instantly to your balance
          </p>
        </div>

        {/* Customer Details */}
        <div className="bg-white rounded-2xl p-5">
          <h3 className="font-bold text-[#1F1F1F] mb-4">Customer Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#6B6B6B] mb-2">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#328100]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#6B6B6B] mb-2">Email Address</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@email.com"
                className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#328100]"
              />
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="bg-white rounded-2xl p-5">
          <h3 className="font-bold text-[#1F1F1F] mb-4">Invoice Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#6B6B6B] mb-2">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Service or product description"
                className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#328100]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#6B6B6B] mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B]">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 bg-[#F5F5F5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#328100]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#6B6B6B] mb-2">
                Preferred Payment Currency
              </label>
              <div className="flex gap-2 mb-3">
                {["crypto", "fiat"].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setCurrencyType(type as "crypto" | "fiat");
                      setCurrency(type === "crypto" ? "USDC" : "USD");
                    }}
                    className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
                      currencyType === type
                        ? "bg-[#328100] text-white"
                        : "bg-[#F5F5F5] text-[#6B6B6B]"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {(currencyType === "crypto" ? cryptoCurrencies : fiatCurrencies).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                      currency === curr
                        ? "bg-[#328100] text-white"
                        : "bg-[#F5F5F5] text-[#6B6B6B]"
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#6B6B6B] mb-2">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#328100]"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl p-5">
          <div className="flex justify-between mb-3">
            <span className="text-[#6B6B6B]">Subtotal</span>
            <span className="text-[#1F1F1F] font-medium">${amount || "0.00"}</span>
          </div>
          <div className="flex justify-between mb-3 pb-3 border-b border-[#F5F5F5]">
            <span className="text-[#6B6B6B]">Fee (0.5%)</span>
            <span className="text-[#1F1F1F] font-medium">${fee}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-[#1F1F1F]">Total</span>
            <span className="font-bold text-xl text-[#328100]">${total}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          onClick={handleSendInvoice}
          disabled={!isConnected || loading || isTxPending}
          className="w-full py-4 bg-[#328100] text-white rounded-2xl font-medium hover:bg-[#2a6e00] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#328100]/20 disabled:opacity-50"
        >
          {loading || isTxPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {loading && !isTxPending ? "Saving to server..." : "Creating on-chain..."}
            </>
          ) : (
            <><Send className="w-5 h-5" /> Send Invoice</>
          )}
        </button>

        <p className="text-center text-xs text-[#6B6B6B] pb-4">
          Saved to your account + secured on Morph
        </p>
      </div>
    </div>
  );
}
