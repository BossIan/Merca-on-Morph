"use client";

import { useNavigate } from "react-router";
import {
  ArrowLeft, User, Building2, Mail, Phone,
  Shield, Bell, HelpCircle, LogOut, ChevronRight,
  CheckCircle, AlertCircle, Wallet,
} from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";
import { useAuthGuard } from "../../hooks/useAuthGuard";

export function Profile() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { isChecking } = useAuthGuard();

  // Read user from localStorage (set during login/signup)
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const fullName = [storedUser.first_name, storedUser.middle_name, storedUser.last_name]
    .filter(Boolean)
    .join(" ");

  const kycStatus: "approved" | "pending" | "not_started" =
    storedUser.kyc_status || "not_started";

  const userInfo = {
    name:         fullName || "—",
    businessName: storedUser.business_name || "—",
    email:        storedUser.email || "—",
    phone:        storedUser.phone || "—",
  };

  function getKYCBadge() {
    switch (kycStatus) {
      case "approved":
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-[#E8F5E0] rounded-full">
            <CheckCircle className="w-4 h-4 text-[#328100]" />
            <span className="text-sm font-medium text-[#328100]">Verified</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-[#FFF4E5] rounded-full">
            <AlertCircle className="w-4 h-4 text-[#FF9500]" />
            <span className="text-sm font-medium text-[#FF9500]">Pending</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-[#FFE5E5] rounded-full">
            <AlertCircle className="w-4 h-4 text-[#DC2626]" />
            <span className="text-sm font-medium text-[#DC2626]">Not Verified</span>
          </div>
        );
    }
  }

  function handleLogout() {
    if (confirm("Are you sure you want to logout?")) {
      disconnect();
      localStorage.removeItem("wagmi.store");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  }

  if (isChecking) return null;

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] pb-24">
      <div className="bg-white px-6 pt-12 pb-6 rounded-b-3xl shadow-sm mb-6">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate("/dashboard")} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-[#1F1F1F]" />
          </button>
          <h2 className="font-bold text-[#1F1F1F]">Profile & Settings</h2>
          <div className="w-10" />
        </div>

        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 bg-[#E8F5E0] rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-[#328100]" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-xl text-[#1F1F1F] mb-1">
              {userInfo.name !== "—" ? userInfo.name : "Welcome!"}
            </h3>
            <p className="text-sm text-[#6B6B6B]">
              {userInfo.businessName !== "—" ? userInfo.businessName : "Complete your profile"}
            </p>
          </div>
        </div>

        {/* Wallet address */}
        {address && (
          <div className="bg-[#F5F5F5] rounded-xl px-4 py-2.5 flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-[#328100] rounded-full" />
            <span className="text-xs font-mono text-[#6B6B6B]">
              {address.slice(0, 8)}...{address.slice(-6)}
            </span>
            <Wallet className="w-3 h-3 text-[#328100] ml-auto" />
          </div>
        )}

        {getKYCBadge()}
      </div>

      <div className="px-6 space-y-4">

        {/* Account info */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <h3 className="font-bold text-[#1F1F1F] px-5 pt-5 pb-3">
            Account Information
          </h3>

          <div className="w-full px-5 py-4 flex items-center gap-4 border-t border-[#F5F5F5]">
            <Wallet className="w-5 h-5 text-[#6B6B6B]" />
            <div className="flex-1 text-left">
              <p className="text-sm text-[#6B6B6B]">Wallet Address</p>
              <p className="font-mono text-sm text-[#1F1F1F]">
                {address
                  ? `${address.slice(0, 10)}...${address.slice(-8)}`
                  : "—"}
              </p>
            </div>
          </div>

          <button className="w-full px-5 py-4 flex items-center gap-4 hover:bg-[#F5F5F5] transition-colors border-t border-[#F5F5F5]">
            <Building2 className="w-5 h-5 text-[#6B6B6B]" />
            <div className="flex-1 text-left">
              <p className="text-sm text-[#6B6B6B]">Business Name</p>
              <p className={`font-medium ${userInfo.businessName === "—" ? "text-[#6B6B6B] italic text-sm" : "text-[#1F1F1F]"}`}>
                {userInfo.businessName === "—" ? "— pending backend —" : userInfo.businessName}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />
          </button>

          <button className="w-full px-5 py-4 flex items-center gap-4 hover:bg-[#F5F5F5] transition-colors border-t border-[#F5F5F5]">
            <Mail className="w-5 h-5 text-[#6B6B6B]" />
            <div className="flex-1 text-left">
              <p className="text-sm text-[#6B6B6B]">Email</p>
              <p className={`font-medium ${userInfo.email === "—" ? "text-[#6B6B6B] italic text-sm" : "text-[#1F1F1F]"}`}>
                {userInfo.email === "—" ? "— pending backend —" : userInfo.email}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />
          </button>

          <button className="w-full px-5 py-4 flex items-center gap-4 hover:bg-[#F5F5F5] transition-colors border-t border-[#F5F5F5]">
            <Phone className="w-5 h-5 text-[#6B6B6B]" />
            <div className="flex-1 text-left">
              <p className="text-sm text-[#6B6B6B]">Phone</p>
              <p className={`font-medium ${userInfo.phone === "—" ? "text-[#6B6B6B] italic text-sm" : "text-[#1F1F1F]"}`}>
                {userInfo.phone === "—" ? "— pending backend —" : userInfo.phone}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />
          </button>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <h3 className="font-bold text-[#1F1F1F] px-5 pt-5 pb-3">Settings</h3>

          <button
            onClick={() => navigate("/kyc")}
            className="w-full px-5 py-4 flex items-center gap-4 hover:bg-[#F5F5F5] transition-colors border-t border-[#F5F5F5]"
          >
            <Shield className="w-5 h-5 text-[#6B6B6B]" />
            <div className="flex-1 text-left">
              <p className="font-medium text-[#1F1F1F]">KYC Verification</p>
              <p className="text-sm text-[#6B6B6B]">Manage identity verification</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />
          </button>

          <button className="w-full px-5 py-4 flex items-center gap-4 hover:bg-[#F5F5F5] transition-colors border-t border-[#F5F5F5]">
            <Bell className="w-5 h-5 text-[#6B6B6B]" />
            <div className="flex-1 text-left">
              <p className="font-medium text-[#1F1F1F]">Notifications</p>
              <p className="text-sm text-[#6B6B6B]">Manage notification preferences</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />
          </button>

          <button className="w-full px-5 py-4 flex items-center gap-4 hover:bg-[#F5F5F5] transition-colors border-t border-[#F5F5F5]">
            <Shield className="w-5 h-5 text-[#6B6B6B]" />
            <div className="flex-1 text-left">
              <p className="font-medium text-[#1F1F1F]">Security</p>
              <p className="text-sm text-[#6B6B6B]">Password, 2FA, and security settings</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />
          </button>
        </div>

        {/* Support */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <h3 className="font-bold text-[#1F1F1F] px-5 pt-5 pb-3">Support</h3>

          <button
            onClick={() => navigate("/how-it-works")}
            className="w-full px-5 py-4 flex items-center gap-4 hover:bg-[#F5F5F5] transition-colors border-t border-[#F5F5F5]"
          >
            <HelpCircle className="w-5 h-5 text-[#6B6B6B]" />
            <div className="flex-1 text-left">
              <p className="font-medium text-[#1F1F1F]">Help Center</p>
              <p className="text-sm text-[#6B6B6B]">FAQs and guides</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />
          </button>

          <button className="w-full px-5 py-4 flex items-center gap-4 hover:bg-[#F5F5F5] transition-colors border-t border-[#F5F5F5]">
            <Mail className="w-5 h-5 text-[#6B6B6B]" />
            <div className="flex-1 text-left">
              <p className="font-medium text-[#1F1F1F]">Contact Support</p>
              <p className="text-sm text-[#6B6B6B]">Get help from our team</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 hover:bg-[#FFE5E5] transition-colors"
        >
          <LogOut className="w-5 h-5 text-[#DC2626]" />
          <p className="font-medium text-[#DC2626]">Logout</p>
        </button>

        <div className="text-center text-sm text-[#6B6B6B] pt-4 pb-6">
          <p>Merca v1.0.0</p>
          <p>© 2026 Merca. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
