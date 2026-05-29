"use client";

import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft, Share2, Copy, Check, Clock,
  CheckCircle, XCircle, AlertCircle, Loader2, ExternalLink
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useInvoice } from "../../hooks/useMercaInvoice";
import { CONTRACTS, INVOICE_ABI } from "../../lib/merca-config";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function InvoiceDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get("id") as `0x${string}` | null;

  const { address, isConnected } = useAccount();
  const { invoice, isLoading, refetch } = useInvoice(invoiceId ?? undefined);
  const { writeContractAsync } = useWriteContract();

  const [copied,      setCopied]      = useState(false);
  const [cancelling,  setCancelling]  = useState(false);
  const [cancelTxHash, setCancelTxHash] = useState<`0x${string}` | undefined>();
  const [cancelError, setCancelError] = useState("");
  const [backendInvoice, setBackendInvoice] = useState<any>(null);
  const [backendLoading, setBackendLoading] = useState(false);

  const { isSuccess: cancelSuccess } = useWaitForTransactionReceipt({ hash: cancelTxHash });

  // Fetch backend invoice data by on_chain_id
  useEffect(() => {
    if (!invoiceId) return;
    
    const fetchBackendInvoice = async () => {
      setBackendLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        const res = await fetch(`${API_URL}/api/invoices?on_chain_id=${invoiceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          // data is an array, find the one matching on_chain_id
          const match = Array.isArray(data) ? data.find((inv: any) => inv.on_chain_id === invoiceId) : data;
          setBackendInvoice(match || null);
        }
      } catch (err) {
        console.error("Failed to fetch backend invoice:", err);
      } finally {
        setBackendLoading(false);
      }
    };
    
    fetchBackendInvoice();
  }, [invoiceId]);

  useEffect(() => {
    if (!invoiceId || invoice?.status === "Pending") return;
    
    const token = localStorage.getItem("token");
    if (!token) return;

    const refetchBackend = async () => {
      try {
        const res = await fetch(`${API_URL}/api/invoices?on_chain_id=${invoiceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          const match = Array.isArray(data) ? data.find((inv: any) => inv.on_chain_id === invoiceId) : data;
          setBackendInvoice(match || null);
        }
      } catch (err) {
        console.error("Failed to refetch backend invoice:", err);
      }
    };

    refetchBackend();
  }, [invoice?.status, invoiceId]);

  // Listen for payment events and refetch backend data immediately
  useEffect(() => {
    if (!invoiceId) return;

    const handlePaymentReceived = () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const refetchBackend = async () => {
        try {
          // Add a small delay to let backend process the update
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const res = await fetch(`${API_URL}/api/invoices?on_chain_id=${invoiceId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (res.ok) {
            const data = await res.json();
            const match = Array.isArray(data) ? data.find((inv: any) => inv.on_chain_id === invoiceId) : data;
            setBackendInvoice(match || null);
          }
        } catch (err) {
          console.error("Failed to refetch backend invoice on payment:", err);
        }
      };

      refetchBackend();
    };

    window.addEventListener("merca-payment-received", handlePaymentReceived);
    return () => window.removeEventListener("merca-payment-received", handlePaymentReceived);
  }, [invoiceId]);

  const paymentLink = invoiceId
    ? `${window.location.origin}/pay/${invoiceId}`
    : "";

  function handleCopyLink() {
    navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShare() {
    if (navigator.share && paymentLink) {
      navigator.share({ title: "MERCA Invoice", url: paymentLink });
    } else {
      handleCopyLink();
    }
  }

  async function handleCancel() {
    if (!invoiceId) return;
    if (!confirm("Are you sure you want to cancel this invoice? This cannot be undone.")) return;

    setCancelError("");
    setCancelling(true);
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.MERCA_INVOICE,
        abi: INVOICE_ABI,
        functionName: "cancelInvoice",
        args: [invoiceId],
      });
      setCancelTxHash(hash);
      // Refetch after a short delay to get updated status
      setTimeout(() => refetch(), 3000);
    } catch (err: any) {
      setCancelError(err?.shortMessage ?? err?.message ?? "Cancel failed");
    } finally {
      setCancelling(false);
    }
  }

  function getStatusConfig(status: string) {
    switch (status) {
      case "Paid":      return { bg: "bg-[#E8F5E0]", text: "text-[#328100]",  icon: CheckCircle  };
      case "Pending":   return { bg: "bg-[#FFF4E5]", text: "text-[#FF9500]",  icon: Clock        };
      case "Cancelled": return { bg: "bg-[#FFE5E5]", text: "text-[#DC2626]",  icon: XCircle      };
      case "Expired":   return { bg: "bg-[#F5F5F5]", text: "text-[#6B6B6B]",  icon: AlertCircle  };
      default:          return { bg: "bg-[#F5F5F5]", text: "text-[#6B6B6B]",  icon: Clock        };
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#328100] animate-spin" />
          <p className="text-[#6B6B6B] text-sm">Loading invoice...</p>
        </div>
      </div>
    );
  }

  // ─── Not found ────────────────────────────────────────────────────────────

  if (!invoice && !isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#1F1F1F] mb-2">Invoice Not Found</h2>
          <p className="text-sm text-[#6B6B6B] mb-4">
            This invoice doesn't exist on-chain.
          </p>
          <button
            onClick={() => navigate("/invoice-list")}
            className="px-6 py-2.5 bg-[#328100] text-white rounded-xl font-medium text-sm"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(invoice?.status ?? "Pending");
  const StatusIcon = statusConfig.icon;
  const fee = invoice ? (parseFloat(invoice.amount) * 0.005) : 0;
  const net = invoice ? (parseFloat(invoice.amount) - fee) : 0;

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] pb-6">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/invoice-list")} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-[#1F1F1F]" />
          </button>
          <h2 className="font-bold text-[#1F1F1F]">Invoice Details</h2>
          {invoice?.status === "Pending" && (
            <button onClick={handleShare} className="p-2">
              <Share2 className="w-6 h-6 text-[#328100]" />
            </button>
          )}
          {invoice?.status !== "Pending" && <div className="w-10" />}
        </div>

        <div className="text-center mb-4">
          <p className="text-sm text-[#6B6B6B] mb-2">Invoice ID</p>
          <p className="text-xs font-mono text-[#1F1F1F] mb-3 break-all px-4">
            {invoiceId?.slice(0, 18)}...{invoiceId?.slice(-8)}
          </p>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
            <StatusIcon className="w-5 h-5" />
            <span className="font-medium">{invoice?.status}</span>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-4">

        {/* Cancel success banner */}
        {cancelSuccess && (
          <div className="bg-[#E8F5E0] border border-[#328100]/20 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#328100] flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#328100]">Invoice cancelled</p>
              {cancelTxHash && (
                <a
                  href={`https://explorer-hoodi.morphl2.io/tx/${cancelTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#328100] underline flex items-center gap-1 mt-0.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  View on Morph Explorer
                </a>
              )}
            </div>
          </div>
        )}

        {/* Cancel error */}
        {cancelError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{cancelError}</p>
          </div>
        )}

        {/* Customer info — from backend */}
        <div className="bg-white rounded-2xl p-5">
          <h3 className="font-bold text-[#1F1F1F] mb-4">Customer Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-[#6B6B6B]">Customer Name</p>
              {backendLoading ? (
                <p className="text-sm text-[#6B6B6B]">Loading...</p>
              ) : (
                <p className="text-sm font-medium text-[#1F1F1F]">
                  {backendInvoice?.customer_name || "—"}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-[#6B6B6B]">Email</p>
              {backendLoading ? (
                <p className="text-sm text-[#6B6B6B]">Loading...</p>
              ) : (
                <p className="text-sm font-medium text-[#1F1F1F]">
                  {backendInvoice?.customer_email || "—"}
                </p>
              )}
            </div>
            
          </div>
        </div>

        {/* Invoice details */}
        <div className="bg-white rounded-2xl p-5">
          <h3 className="font-bold text-[#1F1F1F] mb-4">Invoice Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Description</span>
              <span className="font-medium text-[#1F1F1F] text-right max-w-[55%]">
                {invoice?.description}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Issue Date</span>
              <span className="font-medium text-[#1F1F1F]">
                {invoice?.createdAt.toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric"
                })}
              </span>
            </div>
            {backendInvoice?.due_date && (
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Due Date</span>
                <span className={`font-medium ${
                  new Date(backendInvoice.due_date) < new Date() ? "text-red-500" : "text-[#1F1F1F]"
                }`}>
                  {new Date(backendInvoice.due_date).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric"
                  })}
                </span>
              </div>
            )}
  
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Currency</span>
              <span className="font-medium text-[#1F1F1F]">USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Network</span>
              <span className="font-medium text-[#1F1F1F]">Morph Hoodi</span>
            </div>
          </div>
        </div>

        {/* Amount breakdown */}
        <div className="bg-white rounded-2xl p-5">
          <h3 className="font-bold text-[#1F1F1F] mb-4">Amount Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Subtotal</span>
              <span className="font-medium text-[#1F1F1F]">${invoice?.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Transaction Fee (0.5%)</span>
              <span className="font-medium text-[#1F1F1F]">${fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-[#E5E5E5]">
              <span className="font-bold text-[#1F1F1F]">Net Amount</span>
              <span className="font-bold text-xl text-[#328100]">
                ${net.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment link — only for pending */}
        {invoice?.status === "Pending" && (
          <div className="bg-white rounded-2xl p-5">
            <h3 className="font-bold text-[#1F1F1F] mb-3">Payment Link</h3>
            <div className="bg-[#F5F5F5] rounded-xl p-4 mb-3">
              <p className="text-sm text-[#1F1F1F] break-all">{paymentLink}</p>
            </div>
            <button
              onClick={handleCopyLink}
              className="w-full py-3 bg-white border-2 border-[#328100] text-[#328100] rounded-xl font-medium hover:bg-[#E8F5E0] transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <><Check className="w-5 h-5" /> Copied!</>
              ) : (
                <><Copy className="w-5 h-5" /> Copy Link</>
              )}
            </button>
          </div>
        )}

        {/* Explorer link */}
        {invoiceId && (
          <a
            href={`https://explorer-hoodi.morphl2.io/address/${CONTRACTS.MERCA_INVOICE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-[#328100] py-2"
          >
            <ExternalLink className="w-4 h-4" />
            View contract on Morph Explorer
          </a>
        )}

        {/* Cancel button — only for pending */}
        {invoice?.status === "Pending" && !cancelSuccess && (
          <button
            onClick={handleCancel}
            disabled={cancelling || !isConnected}
            className="w-full py-4 bg-white border-2 border-red-400 text-red-500 rounded-2xl font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {cancelling ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Cancelling...</>
            ) : (
              <><XCircle className="w-5 h-5" /> Cancel Invoice</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
