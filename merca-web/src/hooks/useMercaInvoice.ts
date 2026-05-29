import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  CONTRACTS, INVOICE_ABI, ERC20_ABI,
  generateInvoiceId, toUSDCUnits, dateToTimestamp, formatUSDC
} from "../lib/merca-config";
import { useState } from "react";

export type InvoiceStatus = "Pending" | "Paid" | "Cancelled" | "Expired";

const STATUS_MAP: InvoiceStatus[] = ["Pending", "Paid", "Cancelled", "Expired"];

export function useMercaInvoice() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isApproving, setIsApproving] = useState(false);

  const { isLoading: isTxPending, isSuccess: isTxSuccess } =
    useWaitForTransactionReceipt({ hash: txHash });

  // Get all invoice IDs for connected merchant
  const { data: invoiceIds, refetch: refetchIds } = useReadContract({
    address: CONTRACTS.MERCA_INVOICE,
    abi: INVOICE_ABI,
    functionName: "getMerchantInvoices",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Create invoice — approves USDC then calls createInvoice
  async function createInvoice({
    customerAddress,
    amount,
    description,
  }: {
    customerAddress?: string;
    amount: string;
    description: string;
  }) {
    if (!address) throw new Error("No wallet connected");

    const id          = generateInvoiceId();
    const amountUnits = toUSDCUnits(amount);
    const expiresAt   = 0n;
    const customer    = (customerAddress as `0x${string}`) || "0x0000000000000000000000000000000000000000";

    const hash = await writeContractAsync({
      address: CONTRACTS.MERCA_INVOICE,
      abi: INVOICE_ABI,
      functionName: "createInvoice",
      args: [id, customer, amountUnits, CONTRACTS.USDC, expiresAt, description],
    });

    setTxHash(hash);
    return { hash, invoiceId: id };
  }

  // Pay invoice — approves USDC then calls payInvoice
  async function payInvoice(invoiceId: `0x${string}`, amount: bigint) {
    if (!address) throw new Error("No wallet connected");

    // Step 1: approve USDC
    setIsApproving(true);
    const approveHash = await writeContractAsync({
      address: CONTRACTS.USDC,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONTRACTS.MERCA_INVOICE, amount],
    });
    setTxHash(approveHash);

    // Wait for approval then pay
    setIsApproving(false);
    const payHash = await writeContractAsync({
      address: CONTRACTS.MERCA_INVOICE,
      abi: INVOICE_ABI,
      functionName: "payInvoice",
      args: [invoiceId],
    });
    setTxHash(payHash);
    return payHash;
  }

  // Cancel invoice
  async function cancelInvoice(invoiceId: `0x${string}`) {
    if (!address) throw new Error("No wallet connected");
    const hash = await writeContractAsync({
      address: CONTRACTS.MERCA_INVOICE,
      abi: INVOICE_ABI,
      functionName: "cancelInvoice",
      args: [invoiceId],
    });
    setTxHash(hash);
    return hash;
  }

  return {
    invoiceIds:   invoiceIds ?? [],
    createInvoice,
    payInvoice,
    cancelInvoice,
    isApproving,
    isTxPending,
    isTxSuccess,
    txHash,
    refetchIds,
  };
}

// Hook to read a single invoice by ID
export function useInvoice(invoiceId: `0x${string}` | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.MERCA_INVOICE,
    abi: INVOICE_ABI,
    functionName: "getInvoice",
    args: invoiceId ? [invoiceId] : undefined,
    query: { enabled: !!invoiceId },
  });

  return {
    invoice: data
      ? {
          id:          data.id,
          merchant:    data.merchant,
          customer:    data.customer,
          amount:      formatUSDC(data.amount),
          amountRaw:   data.amount,
          token:       data.token,
          status:      STATUS_MAP[data.status] ?? "Pending",
          createdAt:   new Date(Number(data.createdAt) * 1000),
          expiresAt:   data.expiresAt > 0n
                         ? new Date(Number(data.expiresAt) * 1000)
                         : null,
          description: data.description,
        }
      : null,
    isLoading,
    refetch,
  };
}
