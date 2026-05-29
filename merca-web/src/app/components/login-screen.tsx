"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Wallet, Loader2 } from "lucide-react";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import mercaLogo from "../../imports/BestFloatCompetition.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function LoginScreen() {
  const navigate = useNavigate();
  const { connect, connectors, isPending } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  // Once wallet connects, check if user exists in DB
  useEffect(() => {
    if (isConnected && address) {
      checkWallet(address);
    }
  }, [isConnected, address]);

  async function checkWallet(walletAddress: string) {
    setChecking(true);
    setError("");

    try {
      const res = await fetch(
        `${API_URL}/api/auth/check-wallet?address=${walletAddress}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError("Server error. Please try again.");
        disconnect();
        return;
      }

      if (data.exists) {
        // Known user → save token and go to dashboard
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/dashboard");
      } else {
        // New user → go to signup to fill in details
        navigate("/signup");
      }
    } catch (err) {
      setError("Could not connect to server. Please try again.");
      disconnect();
    } finally {
      setChecking(false);
    }
  }

  function handleConnect() {
    setError("");
    connect({ connector: connectors[0] });
  }

  const isLoading = isPending || checking;

  return (
    <div className="h-screen w-full bg-white flex flex-col px-6 py-12">
      <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">

        {/* Logo */}
        <div className="mb-16 flex justify-center">
          <ImageWithFallback
            src={mercaLogo}
            alt="Merca Logo"
            className="w-48 h-auto"
          />
        </div>

        {/* Heading */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-[#1F1F1F] mb-3">
            Welcome to Merca
          </h1>
          <p className="text-[#6B6B6B]">
            Connect your wallet to start accepting payments instantly
          </p>
        </div>

        {/* Connect Wallet button */}
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="w-full py-4 bg-[#328100] text-white rounded-2xl font-medium hover:bg-[#2a6e00] transition-colors flex items-center justify-center gap-3 shadow-lg shadow-[#328100]/20 disabled:opacity-60 text-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              {isPending ? "Opening wallet..." : "Checking account..."}
            </>
          ) : (
            <>
              <Wallet className="w-6 h-6" />
              Connect Wallet
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <p className="text-center text-sm text-red-500 mt-4">{error}</p>
        )}

        {/* How it works */}
        <div className="mt-12 space-y-4">
          {[
            { step: "1", text: "Connect your MetaMask or any Web3 wallet" },
            { step: "2", text: "New? Fill in your business details" },
            { step: "3", text: "Start creating invoices and receiving payments" },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-4">
              <div className="w-8 h-8 bg-[#E8F5E0] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#328100]">{item.step}</span>
              </div>
              <p className="text-sm text-[#6B6B6B]">{item.text}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-[#6B6B6B] mt-12">
          Powered by Morph · Instant stablecoin settlement
        </p>
      </div>
    </div>
  );
}
