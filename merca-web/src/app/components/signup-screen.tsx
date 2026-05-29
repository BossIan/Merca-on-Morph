"use client";

import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Loader2, AlertCircle, Wallet } from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import mercaLogo from "../../imports/BestFloatCompetition.png";

const API_URL = "http://localhost:3001";

export function SignupScreen() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    businessName: "",
    email: "",
    phone: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If no wallet connected, send back to login
  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <AlertCircle className="w-12 h-12 text-amber-400 mb-4" />
        <h2 className="text-xl font-bold text-[#1F1F1F] mb-2">No Wallet Connected</h2>
        <p className="text-sm text-[#6B6B6B] mb-6 text-center">
          Please connect your wallet first to create an account.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="px-6 py-3 bg-[#328100] text-white rounded-xl font-medium"
        >
          Go to Login
        </button>
      </div>
    );
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.businessName) {
      setError("Please fill in all required fields");
      return;
    }
    if (!acceptedTerms) {
      setError("Please accept the terms and conditions");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register-wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: address,
          first_name: formData.firstName,
          middle_name: formData.middleName || undefined,
          last_name: formData.lastName,
          business_name: formData.businessName,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Go to KYC onboarding (KYC doesn't need to work yet)
      navigate("/kyc-onboarding");
    } catch (err) {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  }

  function handleDisconnect() {
    disconnect();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col px-6 py-12 overflow-y-auto">
      <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={handleDisconnect} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-[#1F1F1F]" />
          </button>
          <ImageWithFallback
            src={mercaLogo}
            alt="Merca Logo"
            className="w-32 h-auto"
          />
          <div className="w-10" />
        </div>

        {/* Wallet badge */}
        <div className="bg-[#E8F5E0] rounded-xl px-4 py-3 flex items-center gap-3 mb-8">
          <div className="w-2 h-2 bg-[#328100] rounded-full" />
          <div>
            <p className="text-xs text-[#6B6B6B]">Connected wallet</p>
            <p className="text-sm font-mono font-medium text-[#1F1F1F]">
              {address.slice(0, 8)}...{address.slice(-6)}
            </p>
          </div>
          <Wallet className="w-4 h-4 text-[#328100] ml-auto" />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1F1F1F] mb-2">
            Create your account
          </h1>
          <p className="text-[#6B6B6B]">
            Tell us about your business to get started
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4 mb-6">

          {/* First name */}
          <div>
            <label className="block text-sm mb-2 text-[#1F1F1F]">
              First Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Juan"
              required
              className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#328100]"
            />
          </div>

          {/* Middle name */}
          <div>
            <label className="block text-sm mb-2 text-[#1F1F1F]">
              Middle Name <span className="text-[#6B6B6B] text-xs">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.middleName}
              onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
              placeholder="Santos"
              className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#328100]"
            />
          </div>

          {/* Last name */}
          <div>
            <label className="block text-sm mb-2 text-[#1F1F1F]">
              Last Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="dela Cruz"
              required
              className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#328100]"
            />
          </div>

          {/* Business name */}
          <div>
            <label className="block text-sm mb-2 text-[#1F1F1F]">
              Business Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              placeholder="Your business name"
              required
              className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#328100]"
            />
          </div>
          {/* Email */}
          <div>
            <label className="block text-sm mb-2 text-[#1F1F1F]">
              Email Address
            </label>
            <input
            required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="juan@email.com"
              className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#328100]"
            />
          </div>
          {/* Phone */}
          <div>
            <label className="block text-sm mb-2 text-[#1F1F1F]">
              Phone Number <span className="text-[#6B6B6B] text-xs">(optional)</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+63 912 345 6789"
              className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#328100]"
            />
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3 pt-2">
            <input
              id="terms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-5 h-5 accent-[#328100]"
            />
            <label htmlFor="terms" className="text-sm text-[#6B6B6B]">
              I agree to Merca's{" "}
              <button type="button" className="text-[#328100] font-medium">
                Terms of Service
              </button>{" "}
              and{" "}
              <button type="button" className="text-[#328100] font-medium">
                Privacy Policy
              </button>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#328100] text-white rounded-2xl font-medium hover:bg-[#2a6e00] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-[#328100]/20 mt-2"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Creating Account...</>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-[#6B6B6B]">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-[#328100] font-medium"
          >
            Connect Wallet
          </button>
        </p>
      </div>
    </div>
  );
}
