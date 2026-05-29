import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { CheckCircle, Download, Share2 } from "lucide-react";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export function Success() {
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
          Payment Settled Successfully!
        </h1>
        <p className="text-[#6B6B6B]">
          Your payment has been processed and settled
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
            <span className="text-[#6B6B6B]">Amount</span>
            <span className="font-bold text-[#1F1F1F]">$2,450.00</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#6B6B6B]">Payment method</span>
            <span className="font-medium text-[#1F1F1F]">USDC</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#6B6B6B]">Transaction fee</span>
            <span className="font-medium text-[#1F1F1F]">$12.25 (0.5%)</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#E5E5E5]">
            <span className="text-[#1F1F1F] font-medium">Net amount</span>
            <span className="font-bold text-xl text-[#328100]">$2,437.75</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-md space-y-3"
      >
        <button className="w-full py-3.5 bg-white border-2 border-[#328100] text-[#328100] rounded-xl font-medium hover:bg-[#E8F5E0] transition-colors flex items-center justify-center gap-2">
          <Download className="w-5 h-5" />
          Download Receipt
        </button>

        <button className="w-full py-3.5 bg-white border-2 border-[#E5E5E5] text-[#1F1F1F] rounded-xl font-medium hover:bg-[#F5F5F5] transition-colors flex items-center justify-center gap-2">
          <Share2 className="w-5 h-5" />
          Share Receipt
        </button>

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full py-3.5 bg-[#328100] text-white rounded-xl font-medium hover:bg-[#2a6e00] transition-colors mt-6"
        >
          Back to Dashboard
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <p className="text-sm text-[#6B6B6B]">Transaction ID</p>
        <p className="text-xs text-[#1F1F1F] font-mono mt-1">
          0x7a9f2...4c8e1b
        </p>
      </motion.div>
    </div>
  );
}
