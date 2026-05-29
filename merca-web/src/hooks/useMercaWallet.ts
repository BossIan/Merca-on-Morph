import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS, WALLET_ABI, ERC20_ABI, formatUSDC, toUSDCUnits } from "../lib/merca-config";
import { useEffect, useState } from "react";


export function useMercaWallet() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  // Total USDC balance across all wallets
  const { data: totalBalance, refetch: refetchTotal } = useReadContract({
    address: CONTRACTS.MERCA_WALLET,
    abi: WALLET_ABI,
    functionName: "getTotalBalance",
    args: address ? [address, CONTRACTS.USDC] : undefined,
    query: { enabled: !!address },
  });

  // Wallet 0 (default) balance
  const { data: wallet0Balance, refetch: refetchW0 } = useReadContract({
    address: CONTRACTS.MERCA_WALLET,
    abi: WALLET_ABI,
    functionName: "getBalance",
    args: address ? [address, CONTRACTS.USDC, 0n] : undefined,
    query: { enabled: !!address },
  });

  // Wallet count
  const { data: walletCount } = useReadContract({
    address: CONTRACTS.MERCA_WALLET,
    abi: WALLET_ABI,
    functionName: "walletCount",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // USDC balance in user's own wallet
 const { data: usdcBalance, refetch: refetchUsdc } = useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { isLoading: isTxPending, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  function refetch() {
    refetchTotal();
    refetchW0();
    refetchUsdc();
  }

  useEffect(() => {
    const handleLivePayment = () => {
      console.log("⚡ Live payment detected! Re-fetching contract balance state...");
      refetch();
    };

    const handleRealtimeUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ type: string }>;
      if (customEvent.detail?.type === "payment") {
        handleLivePayment();
      }
    };

    window.addEventListener("merca-payment-received", handleLivePayment);
    window.addEventListener("merca-realtime-update", handleRealtimeUpdate);
    return () => {
      window.removeEventListener("merca-payment-received", handleLivePayment);
      window.removeEventListener("merca-realtime-update", handleRealtimeUpdate);
    };
  }, []);

  useEffect(() => {
    if (isTxSuccess) {
      refetch();
      setTxHash(undefined); // Clear hash state safely
    }
  }, [isTxSuccess]);
  // Withdraw all from wallet 0
  async function withdrawAll() {
    if (!address) throw new Error("No wallet connected");
    const hash = await writeContractAsync({
      address: CONTRACTS.MERCA_WALLET,
      abi: WALLET_ABI,
      functionName: "withdraw",
      args: [CONTRACTS.USDC, 0n, BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")],
    });
    setTxHash(hash);
    return hash;
  }

  // Withdraw specific amount from wallet 0
  async function withdrawAmount(amount: string) {
    if (!address) throw new Error("No wallet connected");
    const hash = await writeContractAsync({
      address: CONTRACTS.MERCA_WALLET,
      abi: WALLET_ABI,
      functionName: "withdraw",
      args: [CONTRACTS.USDC, 0n, toUSDCUnits(amount)],
    });
    setTxHash(hash);
    return hash;
  }

  // Create a new sub-wallet
  async function createSubWallet(name: string) {
    if (!address) throw new Error("No wallet connected");
    const hash = await writeContractAsync({
      address: CONTRACTS.MERCA_WALLET,
      abi: WALLET_ABI,
      functionName: "createSubWallet",
      args: [name, address],
    });
    setTxHash(hash);
    return hash;
  }


  return {
    totalBalance: totalBalance ? formatUSDC(totalBalance) : "0.00",
    wallet0Balance: wallet0Balance ? formatUSDC(wallet0Balance) : "0.00",
    wallet0BalanceRaw: wallet0Balance ?? 0n,
    usdcBalance: usdcBalance ? formatUSDC(usdcBalance) : "0.00",
    walletCount: walletCount ? Number(walletCount) : 0,
    withdrawAll,
    withdrawAmount,
    createSubWallet,
    isTxPending,
    txHash,
    refetch,
  };
}
