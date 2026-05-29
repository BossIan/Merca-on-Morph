"use client";

import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { CheckCircle, Loader2, AlertCircle, ArrowLeft, Wallet } from "lucide-react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useInvoice } from "../../hooks/useMercaInvoice";
import { ConnectWallet } from "./ConnectWallet";
import { CONTRACTS, INVOICE_ABI, ERC20_ABI, USDC_DECIMALS } from "../../lib/merca-config";

export function CustomerPayment() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
  const { address, isConnected } = useAccount();

  const { invoice, isLoading } = useInvoice(
    invoiceId as `0x${string}` | undefined
  );

  // Direct Payment Hooks & States
  const { writeContractAsync } = useWriteContract();
  const [payTxHash, setPayTxHash] = useState<`0x${string}` | undefined>();
  const [step, setStep] = useState<"idle" | "approving" | "paying" | "done">("idle");
  const [error, setError] = useState("");
  const [gasEstimate, setGasEstimate] = useState<string>("");

  async function handlePay() {
    if (!address || !invoice || !invoiceId) return;
    setError("");
    setStep("approving");

    try {
      // Step 1: Approve USDC spending
      console.log("Step 1: Approving USDC spending...");
      const approveTx = await writeContractAsync({
        address: CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACTS.MERCA_INVOICE, BigInt(invoice.amountRaw)],
      });

      console.log("Step 2: Calling payInvoice...");
      setStep("paying");

      // Step 2: Pay invoice
      const payTx = await writeContractAsync({
        address: CONTRACTS.MERCA_INVOICE,
        abi: INVOICE_ABI,
        functionName: "payInvoice",
        args: [invoiceId as `0x${string}`],
      });

      setPayTxHash(payTx);
      
      // Notify backend of payment
      await fetch(`${API_URL}/api/invoices/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoiceId,
          txHash: payTx,
          fromAddress: address,
        }),
      }).catch(err => console.error("Backend notification failed:", err));

      setStep("done");
    } catch (err: any) {
      setError(err?.shortMessage ?? err?.message ?? "Payment failed");
      setStep("idle");
    }
  }

  // Success screen
  if (step === "done") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-[#E8F5E0] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-[#328100]" />
          </div>
          <h2 className="text-2xl font-bold text-[#1F1F1F] mb-2">Payment Sent!</h2>
          <p className="text-[#6B6B6B] mb-2">
            You paid <span className="font-bold text-[#1F1F1F]">${invoice?.amount} USDC</span>
          </p>
          <p className="text-sm text-[#6B6B6B] mb-6">
            {invoice?.description}
          </p>
          {payTxHash && (
            <a
              href={`https://explorer-hoodi.morphl2.io/tx/${payTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#328100] underline block mb-6"
            >
              View on Morph Explorer →
            </a>
          )}
          <div className="bg-[#E8F5E0] rounded-xl p-4 mb-6">
            <p className="text-xs text-[#6B6B6B] mb-1">Payment Details</p>
            <p className="text-sm font-bold text-[#328100]">✓ Direct On-Chain Payment</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 bg-[#328100] text-white rounded-xl font-medium"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Loading invoice
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#328100] animate-spin" />
          <p className="text-[#6B6B6B]">Loading invoice...</p>
        </div>
      </div>
    );
  }

  // Invoice not found
  if (!invoice) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#1F1F1F] mb-2">Invoice Not Found</h2>
          <p className="text-[#6B6B6B] text-sm">
            This invoice doesn't exist or has expired.
          </p>
        </div>
      </div>
    );
  }

  // Already paid
  if (invoice.status === "Paid") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-[#328100] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#1F1F1F] mb-2">Already Paid</h2>
          <p className="text-[#6B6B6B] text-sm">This invoice has been paid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 rounded-b-3xl shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-[#1F1F1F]" />
          </button>
          <span className="text-xl font-bold text-[#328100]">merca.</span>
          <div className="w-10" />
        </div>
        <h2 className="text-xl font-bold text-[#1F1F1F]">Payment Request</h2>
        <p className="text-sm text-[#6B6B6B] mt-1">Review and confirm payment</p>
      </div>

      <div className="px-6 space-y-4 flex-1">
        {/* Amount card */}
        <div className="bg-white rounded-2xl p-6 text-center">
          <p className="text-sm text-[#6B6B6B] mb-2">Amount Due</p>
          <p className="text-5xl font-bold text-[#1F1F1F] mb-1">
            ${invoice.amount}
          </p>
          <p className="text-[#6B6B6B]">USDC</p>
        </div>

        {/* Invoice details */}
        <div className="bg-white rounded-2xl p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-[#6B6B6B]">Description</span>
            <span className="font-medium text-[#1F1F1F] text-right max-w-[60%]">
              {invoice.description || "—"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6B6B6B]">Merchant</span>
            <span className="font-medium text-[#1F1F1F]">
              {invoice.merchant.slice(0, 6)}...{invoice.merchant.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6B6B6B]">Status</span>
            <span className="font-medium text-[#328100] capitalize">
              {invoice.status}
            </span>
          </div>
          {invoice.expiresAt && (
            <div className="flex justify-between text-sm">
              <span className="text-[#6B6B6B]">Expires</span>
              <span className="font-medium text-[#1F1F1F]">
                {invoice.expiresAt.toLocaleDateString()}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm pt-2 border-t border-[#F5F5F5]">
            <span className="text-[#6B6B6B]">Gas Fee</span>
            <span className="font-medium text-[#1F1F1F]">Network dependent</span>
          </div>
        </div>

        {/* Connect wallet prompt */}
        {!isConnected && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-800 mb-3 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Connect your wallet to pay
            </p>
            <ConnectWallet />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Step indicator */}
        {step !== "idle" && step !== "done" && (
          <div className="bg-[#E8F5E0] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-[#328100] animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#328100]">
                  {step === "approving" ? "Step 1/2: Approving USDC..." : "Step 2/2: Processing Payment..."}
                </p>
                <p className="text-xs text-[#6B6B6B]">
                  {step === "approving"
                    ? "Approve the transaction in your wallet."
                    : "Confirming payment on the blockchain..."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={!isConnected || step !== "idle"}
          className="w-full py-4 bg-[#328100] text-white rounded-2xl font-bold text-lg hover:bg-[#2a6e00] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-[#328100]/20"
        >
          {step !== "idle" ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
          ) : (
            <>Pay ${invoice.amount} USDC</>
          )}
        </button>

        <p className="text-center text-xs text-[#6B6B6B] pb-6">
          Powered by Morph · Secured on-chain
        </p>
      </div>
    </div>
  );
}