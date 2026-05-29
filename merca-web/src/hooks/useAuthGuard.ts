import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAccount, useDisconnect } from "wagmi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * useAuthGuard
 * Checks that:
 * 1. Wallet is connected (wagmi)
 * 2. Wallet address exists in the backend DB
 * If either fails, redirects to /login
 */
export function useAuthGuard() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Not connected at all → go to login
    if (!isConnected || !address) {
      navigate("/login");
      return;
    }

    // Check if token already in localStorage (already verified this session)
    const token = localStorage.getItem("token");
    const user  = localStorage.getItem("user");

    if (token && user) {
      // Already verified this session — trust it
      setIsAuthorized(true);
      setIsChecking(false);
      return;
    }

    // No token → check backend
    checkWallet(address);
  }, [isConnected, address]);

  async function checkWallet(walletAddress: string) {
    try {
      const res = await fetch(
        `${API_URL}/api/auth/check-wallet?address=${walletAddress}`
      );
      const data = await res.json();

      if (!res.ok || !data.exists) {
        // Wallet not in DB → disconnect and send to login
        disconnect();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      // Save token and user for this session
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setIsAuthorized(true);
    } catch (err) {
      // Server unreachable — if we have a token, let them in anyway
      const token = localStorage.getItem("token");
      if (token) {
        setIsAuthorized(true);
      } else {
        navigate("/login");
      }
    } finally {
      setIsChecking(false);
    }
  }

  return { isChecking, isAuthorized };
}
