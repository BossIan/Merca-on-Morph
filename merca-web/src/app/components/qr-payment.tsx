"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Copy, Share2, Check, Info, Loader2, CheckCircle } from "lucide-react";
import { useAccount } from "wagmi";
import { useMercaInvoice } from "../../hooks/useMercaInvoice";
import { ConnectWallet } from "./ConnectWallet";
import { CONTRACTS } from "../../lib/merca-config";
import { QRCodeSVG as QRCode } from "qrcode.react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function QRPayment() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { createInvoice, isTxPending, isTxSuccess, txHash } = useMercaInvoice();

  const [customerName,  setCustomerName]  = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [description,   setDescription]   = useState("");
  const [dueDate,       setDueDate]       = useState(() => new Date().toISOString().slice(0, 10));
  const [amount,        setAmount]       = useState("0");
  const [currency,      setCurrency]     = useState("USDC");
  const [currencyType,  setCurrencyType] = useState<"crypto" | "fiat">("crypto");
  const [copied,        setCopied]       = useState(false);
  const [invoiceId,     setInvoiceId]    = useState<string>("");
  const [paymentLink,   setPaymentLink]  = useState("");
  const [error,         setError]        = useState("");

  const cryptoCurrencies = ["USDC", "USDT", "DAI", "ETH", "BTC"];
  const fiatCurrencies   = ["USD", "EUR", "GBP", "NGN"];

  // Build payment link when invoice is created
  useEffect(() => {
    if (invoiceId) {
      const link = `${window.location.origin}/pay/${invoiceId}`;
      setPaymentLink(link);
    }
  }, [invoiceId]);

  function handleNumberInput(num: string) {
    setAmount((prev) => (prev === "0" ? num : prev + num));
  }

  function handleBackspace() {
    setAmount((prev) => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
  }

  async function handleGenerateQR() {
    if (!address) { setError("Connect wallet first"); return; }
    if (!customerName || !customerEmail) { setError("Please add customer name and email"); return; }
    if (!description) { setError("Enter a payment description"); return; }
    if (!dueDate) { setError("Select a due date"); return; }
    if (parseFloat(amount) <= 0) { setError("Enter an amount"); return; }
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please sign in to save this invoice");

      const backendRes = await fetch(`${API_URL}/api/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
        throw new Error(backendData.message || "Failed to save invoice to server");
      }

      const backendInvoiceId = backendData.id;
      const { invoiceId: id } = await createInvoice({
        amount,
        description: `${description} — ${customerName}`,
      });

      setInvoiceId(id);

      await fetch(`${API_URL}/api/invoices/${backendInvoiceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ on_chain_id: id }),
      });
    } catch (err: any) {
      setError(err?.shortMessage ?? err?.message ?? "Failed to create invoice");
    }
  }

  function handleCopy() {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleShare() {
    if (navigator.share && paymentLink) {
      navigator.share({ title: "MERCA Payment", url: paymentLink });
    }
  }

  // QR value — either payment link or merchant address
  const qrValue = paymentLink || (address ? `ethereum:${CONTRACTS.USDC}@2910/transfer?address=${address}&uint256=${Math.round(parseFloat(amount || "0") * 1e6)}` : "merca");

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <div className="px-6 pt-12 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/dashboard")} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-[#1F1F1F]" />
          </button>
          <h2 className="font-bold text-[#1F1F1F]">Receive Payment</h2>
          <div className="w-10" />
        </div>

        <div className="bg-[#E8F5E0] rounded-xl p-3 mb-6 flex items-start gap-2">
          <Info className="w-4 h-4 text-[#328100] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#1F1F1F]">
            Accept any currency — converts and settles instantly
          </p>
        </div>

        {!isConnected && (
          <div className="mb-4 flex justify-center">
            <ConnectWallet />
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 mb-6">
          <h3 className="font-bold text-[#1F1F1F] mb-4">Invoice Details</h3>
          <div className="grid gap-4">
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
              <label className="block text-sm text-[#6B6B6B] mb-2">Customer Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@email.com"
                className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#328100]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#6B6B6B] mb-2">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this payment for?"
                className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#328100]"
              />
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

        {/* QR Code */}
        <div className="bg-white border-2 border-[#E5E5E5] rounded-2xl p-6 mb-6 flex flex-col items-center">
          {invoiceId ? (
            <>
              <div className="bg-[#328100] p-4 rounded-xl mb-4">
                <QRCode
                  value={qrValue}
                  size={180}
                  bgColor="#328100"
                  fgColor="#ffffff"
                  level="M"
                />
              </div>
              <p className="text-center text-sm text-[#6B6B6B] mb-2">
                Scan to pay {amount} {currency}
              </p>
              {isTxPending ? (
                <div className="text-xs text-[#6B6B6B]">Waiting for on-chain confirmation...</div>
              ) : (
                <a
                  href={`https://explorer-hoodi.morphl2.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#328100] underline mt-2"
                >
                  View invoice on Morph →
                </a>
              )}
            </>
          ) : (
            <>
              <div className="bg-[#328100] p-6 rounded-xl mb-4 flex items-center justify-center w-48 h-48">
                {isTxPending ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                    <p className="text-white text-xs">Creating invoice...</p>
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-lg opacity-30">
                    <div className="grid grid-cols-6 gap-1">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 ${Math.random() > 0.5 ? "bg-[#1F1F1F]" : "bg-white"}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-center text-sm text-[#6B6B6B]">
                {isTxPending ? "Generating QR..." : "Enter amount and generate QR"}
              </p>
            </>
          )}
        </div>

        {/* Amount display */}
        <div className="bg-[#F5F5F5] rounded-2xl p-6 mb-6">
          <p className="text-sm text-[#6B6B6B] mb-2">Amount</p>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold text-[#1F1F1F]">{amount}</span>
            <span className="text-lg text-[#6B6B6B]">{currency}</span>
          </div>

          <div className="flex gap-2 mb-4">
            {["crypto", "fiat"].map((type) => (
              <button
                key={type}
                onClick={() => setCurrencyType(type as "crypto" | "fiat")}
                className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
                  currencyType === type
                    ? "bg-[#328100] text-white"
                    : "bg-white text-[#6B6B6B]"
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
                    : "bg-white text-[#6B6B6B]"
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {["1","2","3","4","5","6","7","8","9",".","0","←"].map((key) => (
            <button
              key={key}
              onClick={() => {
                if (key === "←") handleBackspace();
                else if (key === "." && !amount.includes(".")) setAmount(amount + ".");
                else if (key !== ".") handleNumberInput(key);
              }}
              className="aspect-square bg-[#F5F5F5] rounded-xl flex items-center justify-center text-xl font-medium text-[#1F1F1F] hover:bg-[#E8F5E0] transition-colors"
            >
              {key === "←" ? <ArrowLeft className="w-5 h-5" /> : key}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center mb-3">{error}</p>
        )}

        {/* Generate / Share buttons */}
        {!isTxSuccess ? (
          <button
            onClick={handleGenerateQR}
            disabled={!isConnected || isTxPending || parseFloat(amount) <= 0}
            className="w-full py-4 bg-[#328100] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 mb-3"
          >
            {isTxPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Creating Invoice...</>
            ) : (
              "Generate QR Code"
            )}
          </button>
        ) : (
          <div className="flex gap-3 mb-3">
            <button
              onClick={handleCopy}
              className="flex-1 py-3.5 bg-white border-2 border-[#328100] text-[#328100] rounded-xl font-medium flex items-center justify-center gap-2"
            >
              {copied ? <><Check className="w-5 h-5" /> Copied!</> : <><Copy className="w-5 h-5" /> Copy Link</>}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 py-3.5 bg-[#328100] text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" /> Share
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
