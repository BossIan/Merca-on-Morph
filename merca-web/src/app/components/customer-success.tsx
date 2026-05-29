import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { CheckCircle, Download, Mail } from "lucide-react";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import mercaLogo from "../../imports/BestFloatCompetition.png";

export function CustomerSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#328100", "#66A830", "#9BC95F"],
    });
  }, []);

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <ImageWithFallback
          src={mercaLogo}
          alt="Merca"
          className="w-32 h-auto mx-auto"
        />
      </motion.div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        className="mb-8"
      >
        <div className="w-24 h-24 bg-[#E8F5E0] rounded-full flex items-center justify-center">
          <CheckCircle className="w-16 h-16 text-[#328100]" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-[#1F1F1F] mb-2">
          Payment Successful!
        </h1>
        <p className="text-[#6B6B6B]">
          Your payment has been processed
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-md bg-[#F5F5F5] rounded-2xl p-6 mb-8"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[#6B6B6B]">Paid to</span>
            <span className="font-bold text-[#1F1F1F]">Acme Corp</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#6B6B6B]">Amount</span>
            <span className="font-bold text-[#1F1F1F]">$2,450.00</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#6B6B6B]">Payment method</span>
            <span className="font-medium text-[#1F1F1F]">USDC</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#6B6B6B]">Date</span>
            <span className="font-medium text-[#1F1F1F]">May 26, 2026</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#E5E5E5]">
            <span className="text-[#1F1F1F] font-medium">Status</span>
            <span className="px-3 py-1 bg-[#E8F5E0] text-[#328100] rounded-full text-sm font-medium">
              Confirmed
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-md space-y-3"
      >
        <button
          onClick={() => navigate("/customer-receipt")}
          className="w-full py-3.5 bg-[#328100] text-white rounded-xl font-medium hover:bg-[#2a6e00] transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          View Receipt
        </button>

        <button className="w-full py-3.5 bg-white border-2 border-[#E5E5E5] text-[#1F1F1F] rounded-xl font-medium hover:bg-[#F5F5F5] transition-colors flex items-center justify-center gap-2">
          <Mail className="w-5 h-5" />
          Email Receipt
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <p className="text-sm text-[#6B6B6B] mb-1">Transaction ID</p>
        <p className="text-xs text-[#1F1F1F] font-mono">
          0x7a9f2c8e1b4d3a5f6e9c2b1a8d4e7f3c5b2a9e6d1f8c3b7a4e2d9f1c8e5b3a6
        </p>
      </motion.div>
    </div>
  );
}
