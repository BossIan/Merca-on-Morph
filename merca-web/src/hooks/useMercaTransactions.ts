import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { createPublicClient, http, parseAbiItem } from "viem";
import { MORPH_HOODI, CONTRACTS, formatUSDC } from "../lib/merca-config";

export type Transaction = {
  id: string;
  invoiceId: string;
  payer: string;
  merchant: string;
  amount: string;
  fee: string;
  net: string;
  status: "completed" | "pending";
  blockNumber: bigint;
  txHash: string;
  timestamp: Date | null;
};

const publicClient = createPublicClient({
  chain: MORPH_HOODI,
  transport: http("https://rpc-hoodi.morph.network"),
});

export function useMercaTransactions() {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    fetchTransactions();
  }, [address]);

  async function fetchTransactions() {
    if (!address) return;
    setIsLoading(true);

    try {

      const latestBlock = await publicClient.getBlockNumber();
      const fromBlock = latestBlock > 4999n ? latestBlock - 4998n : 0n;

      const logs = await publicClient.getLogs({
        address: CONTRACTS.MERCA_INVOICE,
        event: parseAbiItem(
          "event InvoicePaid(bytes32 indexed id, address indexed payer, address indexed merchant, uint256 amount, uint256 fee)"
        ),
        args: { merchant: address },
        fromBlock,
        toBlock: "latest",
      });

      // Fetch block timestamps for each unique block
      const blockNumbers = [...new Set(logs.map((l) => l.blockNumber))];
      const blockTimestamps: Record<string, Date> = {};

      await Promise.all(
        blockNumbers.map(async (bn) => {
          if (bn === null) return;
          const block = await publicClient.getBlock({ blockNumber: bn });
          blockTimestamps[bn.toString()] = new Date(Number(block.timestamp) * 1000);
        })
      );

      const txs: Transaction[] = logs
        .filter((log) => log.args.id && log.args.payer && log.args.merchant)
        .map((log) => {
          const amount = log.args.amount ?? 0n;
          const fee = log.args.fee ?? 0n;
          const net = amount - fee;
          const bn = log.blockNumber?.toString() ?? "";

          return {
            id: log.transactionHash ?? "",
            invoiceId: log.args.id as string,
            payer: log.args.payer as string,
            merchant: log.args.merchant as string,
            amount: formatUSDC(amount + fee), // gross
            fee: formatUSDC(fee),
            net: formatUSDC(net),
            status: "completed" as const,
            blockNumber: log.blockNumber ?? 0n,
            txHash: log.transactionHash ?? "",
            timestamp: blockTimestamps[bn] ?? null,
          };
        })
        .reverse(); // newest first

      setTransactions(txs);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setIsLoading(false);
    }

  }
useEffect(() => {
    if (!address) return;


    const unwatch = publicClient.watchEvent({
      address: CONTRACTS.MERCA_INVOICE,
      event: parseAbiItem(
          "event InvoicePaid(bytes32 indexed id, address indexed payer, address indexed merchant, uint256 amount, uint256 fee)"
        ),
      args: { merchant: address },
      onLogs: async (newLogs) => {
        const validLogs = newLogs.filter(
          (log) => log.args.id && log.args.payer && log.args.merchant
        );

        if (validLogs.length === 0) return;

        const incomingTxs = await Promise.all(
          validLogs.map(async (log) => {
            let timestamp: Date | null = null;
            if (log.blockNumber) {
              try {
                const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
                timestamp = new Date(Number(block.timestamp) * 1000);
              } catch (e) {
                console.error("Failed fetching live block timestamp:", e);
              }
            }

            const amount = log.args.amount ?? 0n;
            const fee = log.args.fee ?? 0n;
            const net = amount - fee;

            return {
              id: log.transactionHash ?? "",
              invoiceId: log.args.id as string,
              payer: log.args.payer as string,
              merchant: log.args.merchant as string,
              amount: formatUSDC(amount + fee),
              fee: formatUSDC(fee),
              net: formatUSDC(net),
              status: "completed" as const,
              blockNumber: log.blockNumber ?? 0n,
              txHash: log.transactionHash ?? "",
              timestamp,
            };
          })
        );

        setTransactions((prevTxs) => {
          const filteredPrev = prevTxs.filter(
            (ptx) => !incomingTxs.some((itx) => itx.id === ptx.id)
          );
          return [...incomingTxs, ...filteredPrev];
        });
      },
    });

    return () => {
      unwatch();
    };
  }, [address]);
  return { transactions, isLoading, refetch: fetchTransactions };
}
