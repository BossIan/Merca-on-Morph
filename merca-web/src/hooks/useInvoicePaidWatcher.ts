import { useEffect, useRef } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
import { CONTRACTS, MORPH_HOODI } from "../lib/merca-config";
import { notifyToast, dispatchRealtimeUpdate } from "./useNotifications";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const POLL_INTERVAL_MS = 15_000; // check every 15 seconds

/**
 * useInvoicePaidWatcher
 * Polls for new InvoicePaid events for the connected merchant.
 * When a new payment is found, creates a notification via the backend.
 *
 * Drop this into Dashboard so it runs while the merchant is logged in.
 */
export function useInvoicePaidWatcher() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const lastCheckedBlock = useRef<bigint | null>(null);
  const seenTxHashes = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!address || !publicClient) return;

    // Initial check — set the starting block without notifying
    initStartingBlock();

    const interval = setInterval(() => {
      checkForNewPayments();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [address, publicClient]);

  async function initStartingBlock() {
    if (!publicClient) return;
    try {
      const latest = await publicClient.getBlockNumber();
      lastCheckedBlock.current = latest;
    } catch (err) {
      console.error("Failed to get block number:", err);
    }
  }

  async function checkForNewPayments() {
    if (!address || !publicClient || lastCheckedBlock.current === null) return;

    try {
      const latest = await publicClient.getBlockNumber();

      // Stay within 4999 block limit
      const fromBlock = lastCheckedBlock.current + 1n;
      if (fromBlock > latest) return;

      const toBlock = fromBlock + 4999n < latest ? fromBlock + 4999n : latest;

      const logs = await publicClient.getLogs({
        address: CONTRACTS.MERCA_INVOICE,
        event: parseAbiItem(
          "event InvoicePaid(bytes32 indexed id, address indexed payer, address indexed merchant, uint256 amount, uint256 fee)"
        ),
        args: { merchant: address },
        fromBlock,
        toBlock,
      });

      for (const log of logs) {
        const txHash = log.transactionHash ?? "";

        // Skip if already notified
        if (seenTxHashes.current.has(txHash)) continue;
        seenTxHashes.current.add(txHash);

        const amount = log.args.amount ?? 0n;
        const fee    = log.args.fee ?? 0n;
        const net    = amount - fee;
        const invoiceId = log.args.id as string; // Extract invoice ID from event

        // Format amount (USDC 6 decimals)
        const netFormatted = (Number(net) / 1_000_000).toFixed(2);
        const payerAddress = log.args.payer as string;
        const toastId = txHash || `${Date.now()}-${payerAddress}`;

        notifyToast({
          id: toastId,
          type: "payment",
          title: "Payment Received",
          message: `You received $${netFormatted} USDC from ${payerAddress.slice(0, 6)}...${payerAddress.slice(-4)}`,
        });

        dispatchRealtimeUpdate("payment");
        window.dispatchEvent(new Event("merca-payment-received"));

        await createPaymentNotification(netFormatted, payerAddress);
        await markInvoiceAsPaid(invoiceId);
      }

      lastCheckedBlock.current = toBlock;
    } catch (err) {
      console.error("Invoice watcher error:", err);
    }
  }

  async function createPaymentNotification(amount: string, payer: string) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type:    "payment",
          title:   "Payment Received",
          message: `You received $${amount} USDC from ${payer.slice(0, 6)}...${payer.slice(-4)}`,
        }),
      });
    } catch (err) {
      console.error("Failed to create notification:", err);
    }
  }

  async function markInvoiceAsPaid(invoiceId: string) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/invoices/mark-paid/${invoiceId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Failed to mark invoice as paid:", err);
    }
  }
}
