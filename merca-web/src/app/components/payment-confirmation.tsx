import { motion } from "motion/react";
import { CheckCircle, Clock, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface PaymentConfirmationProps {
  amount: string;
  currency: string;
  onComplete?: () => void;
}

export function PaymentConfirmation({ amount, currency, onComplete }: PaymentConfirmationProps) {
  const [stage, setStage] = useState<"detecting" | "confirming" | "confirmed">("detecting");

  useEffect(() => {
    const detectTimer = setTimeout(() => {
      setStage("confirming");
    }, 1500);

    const confirmTimer = setTimeout(() => {
      setStage("confirmed");
      if (onComplete) {
        setTimeout(onComplete, 1500);
      }
    }, 3000);

    return () => {
      clearTimeout(detectTimer);
      clearTimeout(confirmTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-white rounded-3xl p-8 max-w-sm w-full"
      >
        <div className="flex flex-col items-center">
          {stage === "detecting" && (
            <>
              <div className="w-20 h-20 bg-[#FFF4E5] rounded-full flex items-center justify-center mb-6">
                <Clock className="w-10 h-10 text-[#FF9500] animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-[#1F1F1F] mb-2">
                Detecting Payment...
              </h3>
              <p className="text-[#6B6B6B] text-center">
                Listening for blockchain transaction
              </p>
            </>
          )}

          {stage === "confirming" && (
            <>
              <div className="w-20 h-20 bg-[#E8F5E0] rounded-full flex items-center justify-center mb-6">
                <Zap className="w-10 h-10 text-[#328100] animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-[#1F1F1F] mb-2">
                Confirming on Chain...
              </h3>
              <p className="text-[#6B6B6B] text-center mb-4">
                ${amount} {currency}
              </p>
              <div className="flex items-center gap-2 text-sm text-[#328100]">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-[#328100] rounded-full"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
                <span>Block confirmation in progress</span>
              </div>
            </>
          )}

          {stage === "confirmed" && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-[#E8F5E0] rounded-full flex items-center justify-center mb-6"
              >
                <CheckCircle className="w-10 h-10 text-[#328100]" />
              </motion.div>
              <h3 className="text-2xl font-bold text-[#1F1F1F] mb-2">
                Payment Confirmed!
              </h3>
              <p className="text-[#6B6B6B] text-center mb-2">
                ${amount} {currency}
              </p>
              <div className="bg-[#E8F5E0] px-4 py-2 rounded-full">
                <p className="text-sm font-medium text-[#328100] flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  Settled instantly
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
