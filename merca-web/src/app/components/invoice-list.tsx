"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Plus, Search, Filter, ChevronRight,
  Loader2, FileText, CheckCircle, Clock, XCircle, AlertCircle
} from "lucide-react";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import { CONTRACTS, INVOICE_ABI, formatUSDC } from "../../lib/merca-config";
import { ConnectWallet } from "./ConnectWallet";

type InvoiceStatus = "Pending" | "Paid" | "Cancelled" | "Expired";
const STATUS_MAP: InvoiceStatus[] = ["Pending", "Paid", "Cancelled", "Expired"];

type InvoiceItem = {
  id: string;
  amount: string;
  status: InvoiceStatus;
  description: string;
  createdAt: Date;
  expiresAt: Date | null;
  customerName: string;
  customerEmail: string;
  referenceNumber: string;
};

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const config = {
    Pending:   { icon: Clock,         color: "text-amber-500",  bg: "bg-amber-50",   label: "Pending"   },
    Paid:      { icon: CheckCircle,   color: "text-[#328100]",  bg: "bg-[#E8F5E0]", label: "Paid"      },
    Cancelled: { icon: XCircle,       color: "text-red-500",    bg: "bg-red-50",     label: "Cancelled" },
    Expired:   { icon: AlertCircle,   color: "text-gray-400",   bg: "bg-gray-50",    label: "Expired"   },
  }[status];

  const Icon = config.icon;

  return (
    <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${config.color} ${config.bg}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export function InvoiceList() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [invoices,  setInvoices]  = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState<"all" | InvoiceStatus>("all");

  // Get all invoice IDs for connected merchant
  const { data: invoiceIds } = useReadContract({
    address: CONTRACTS.MERCA_INVOICE,
    abi: INVOICE_ABI,
    functionName: "getMerchantInvoices",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Fetch each invoice detail
  useEffect(() => {
    if (!invoiceIds || !publicClient || invoiceIds.length === 0) return;
    fetchInvoices();
  }, [invoiceIds, publicClient]);

  async function fetchInvoices() {
    if (!invoiceIds || !publicClient) return;
    setIsLoading(true);

    try {
      const results = await Promise.all(
        invoiceIds.map((id) =>
          publicClient.readContract({
            address: CONTRACTS.MERCA_INVOICE,
            abi: INVOICE_ABI,
            functionName: "getInvoice",
            args: [id],
          })
        )
      );

      const items: InvoiceItem[] = results.map((inv, i) => ({
        id:         invoiceIds[i] as string,
        amount:     formatUSDC(inv.amount),
        status:     STATUS_MAP[inv.status] ?? "Pending",
        description: inv.description || "No description",
        createdAt:  new Date(Number(inv.createdAt) * 1000),
        expiresAt:  inv.expiresAt > 0n
                      ? new Date(Number(inv.expiresAt) * 1000)
                      : null,
        // ⚠️ TODO: Replace with real data from backend API
        customerName:    "— pending backend —",
        customerEmail:   "— pending backend —",
        referenceNumber: `INV-${String(i + 1).padStart(3, "0")}`,
      }));

      // Newest first
      setInvoices(items.reverse());
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const filtered = invoices.filter((inv) => {
    const matchesFilter = filter === "all" || inv.status === filter;
    const matchesSearch =
      !search ||
      inv.description.toLowerCase().includes(search.toLowerCase()) ||
      inv.id.toLowerCase().includes(search.toLowerCase()) ||
      inv.referenceNumber.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all:       invoices.length,
    Pending:   invoices.filter((i) => i.status === "Pending").length,
    Paid:      invoices.filter((i) => i.status === "Paid").length,
    Cancelled: invoices.filter((i) => i.status === "Cancelled").length,
    Expired:   invoices.filter((i) => i.status === "Expired").length,
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] pb-24">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 rounded-b-3xl shadow-sm mb-4">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/dashboard")} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-[#1F1F1F]" />
          </button>
          <h2 className="font-bold text-[#1F1F1F]">Invoices</h2>
          <button
            onClick={() => navigate("/invoice")}
            className="p-2 bg-[#328100] rounded-xl"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices..."
            className="w-full pl-10 pr-4 py-3 bg-[#F5F5F5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#328100]"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", "Pending", "Paid", "Cancelled"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-[#328100] text-white"
                  : "bg-[#F5F5F5] text-[#6B6B6B]"
              }`}
            >
              {f === "all" ? "All" : f}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                filter === f ? "bg-white/20 text-white" : "bg-white text-[#6B6B6B]"
              }`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 space-y-3">
        {/* Not connected */}
        {!isConnected && (
          <div className="bg-white rounded-2xl p-6 text-center">
            <FileText className="w-10 h-10 text-[#6B6B6B] mx-auto mb-3" />
            <p className="text-sm text-[#6B6B6B] mb-3">
              Connect wallet to view your invoices
            </p>
            <ConnectWallet />
          </div>
        )}

        {/* Loading */}
        {isConnected && isLoading && (
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 text-[#328100] animate-spin" />
            <p className="text-sm text-[#6B6B6B]">Loading invoices from Morph...</p>
          </div>
        )}

        {/* Empty state */}
        {isConnected && !isLoading && invoices.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center">
            <FileText className="w-10 h-10 text-[#6B6B6B] mx-auto mb-3" />
            <p className="font-medium text-[#1F1F1F] mb-1">No invoices yet</p>
            <p className="text-sm text-[#6B6B6B] mb-4">
              Create your first invoice to get paid
            </p>
            <button
              onClick={() => navigate("/invoice")}
              className="px-6 py-2.5 bg-[#328100] text-white rounded-xl font-medium text-sm"
            >
              Create Invoice
            </button>
          </div>
        )}

        {/* No results from search */}
        {isConnected && !isLoading && invoices.length > 0 && filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-6 text-center">
            <p className="text-sm text-[#6B6B6B]">No invoices match your search</p>
          </div>
        )}

        {/* Invoice list */}
        {filtered.map((inv) => (
          <div
            key={inv.id}
            onClick={() => navigate(`/invoice-detail?id=${inv.id}`)}
            className="bg-white rounded-2xl p-5 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-[#6B6B6B]">
                    {inv.referenceNumber}
                  </span>
                  <StatusBadge status={inv.status} />
                </div>
                <p className="font-bold text-[#1F1F1F]">{inv.description}</p>
              </div>
              <div className="text-right ml-3">
                <p className="font-bold text-xl text-[#1F1F1F]">
                  ${inv.amount}
                </p>
                <p className="text-xs text-[#6B6B6B]">USDC</p>
              </div>
            </div>

            <div className="border-t border-[#F5F5F5] pt-3 space-y-1.5">
              {/* ⚠️ Customer name — replace with backend data */}
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6B6B]">Customer</span>
                <span className="text-[#6B6B6B] italic text-xs">
                  {inv.customerName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6B6B]">Created</span>
                <span className="font-medium text-[#1F1F1F]">
                  {inv.createdAt.toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric"
                  })}
                </span>
              </div>
              {inv.expiresAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6B6B]">Due</span>
                  <span className={`font-medium ${
                    inv.expiresAt < new Date() ? "text-red-500" : "text-[#1F1F1F]"
                  }`}>
                    {inv.expiresAt.toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric"
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6B6B]">Invoice ID</span>
                <span className="font-mono text-xs text-[#6B6B6B]">
                  {inv.id.slice(0, 10)}...{inv.id.slice(-6)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-2">
              {inv.status === "Pending" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const link = `${window.location.origin}/pay/${inv.id}`;
                    navigator.clipboard.writeText(link);
                  }}
                  className="text-xs text-[#328100] font-medium"
                >
                  Copy payment link
                </button>
              )}
              {inv.status === "Paid" && (
                <span className="text-xs text-[#328100]">✓ Settled to wallet</span>
              )}
              {(inv.status === "Cancelled" || inv.status === "Expired") && (
                <span className="text-xs text-[#6B6B6B]">No action needed</span>
              )}
              <ChevronRight className="w-4 h-4 text-[#6B6B6B] ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
