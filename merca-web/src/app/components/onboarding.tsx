import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { Zap, Layers, DollarSign, ArrowRight } from "lucide-react";

const onboardingSteps = [
  {
    icon: Zap,
    title: "Instant Settlement",
    description: "Get paid in seconds, not days. Stablecoin payments settle instantly on blockchain rails.",
    color: "#328100",
  },
  {
    icon: Layers,
    title: "Unified Payments",
    description: "No more juggling multiple payment apps. Accept all currencies in one place - crypto, fiat, everything.",
    color: "#328100",
  },
  {
    icon: DollarSign,
    title: "Low Fees, Full Transparency",
    description: "Just 0.5% per transaction. No hidden fees, no surprises. See exactly what you earn.",
    color: "#328100",
  },
];

export function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/login");
    }
  };

  const handleSkip = () => {
    navigate("/login");
  };

  const step = onboardingSteps[currentStep];
  const Icon = step.icon;

  return (
    <div className="h-screen w-full bg-white flex flex-col px-6 py-12">
      <div className="flex justify-end mb-8">
        <button
          onClick={handleSkip}
          className="text-[#6B6B6B] font-medium"
        >
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 bg-[#E8F5E0] rounded-3xl flex items-center justify-center mb-8">
              <Icon className="w-12 h-12 text-[#328100]" />
            </div>

            <h2 className="text-3xl font-bold text-[#1F1F1F] mb-4 max-w-sm">
              {step.title}
            </h2>

            <p className="text-lg text-[#6B6B6B] mb-12 max-w-md">
              {step.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center gap-2 mb-8">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? "w-8 bg-[#328100]"
                  : "w-2 bg-[#E5E5E5]"
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full py-4 bg-[#328100] text-white rounded-2xl font-medium hover:bg-[#2a6e00] transition-colors flex items-center justify-center gap-2"
        >
          {currentStep < onboardingSteps.length - 1 ? "Next" : "Get Started"}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
