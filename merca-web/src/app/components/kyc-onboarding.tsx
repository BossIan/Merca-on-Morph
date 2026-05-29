import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { Shield, FileText, Camera, CheckCircle, ArrowRight, Upload } from "lucide-react";

const kycSteps = [
  {
    icon: Shield,
    title: "Verify Your Identity",
    description: "To comply with regulations and enable invoice creation, we need to verify your identity. This is quick, secure, and only done once.",
  },
  {
    icon: FileText,
    title: "What You'll Need",
    description: "A government-issued ID (passport, driver's license, or national ID) and a device with a camera for a selfie.",
  },
  {
    icon: Camera,
    title: "Quick Process",
    description: "Takes less than 3 minutes to complete. Your documents are encrypted and handled securely. Approval typically happens within 1-2 business days.",
  },
];

export function KYCOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < kycSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/kyc");
    }
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  const step = kycSteps[currentStep];
  const Icon = step.icon;

  return (
    <div className="h-screen w-full bg-white flex flex-col px-6 py-12">
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-2">
          {kycSteps.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all ${
                index === currentStep
                  ? "w-8 bg-[#328100]"
                  : index < currentStep
                  ? "w-8 bg-[#328100]"
                  : "w-8 bg-[#E5E5E5]"
              }`}
            />
          ))}
        </div>
        <button
          onClick={handleSkip}
          className="text-[#6B6B6B] font-medium"
        >
          Skip for now
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
            className="flex flex-col items-center text-center max-w-md"
          >
            <div className="w-24 h-24 bg-[#E8F5E0] rounded-3xl flex items-center justify-center mb-8">
              <Icon className="w-12 h-12 text-[#328100]" />
            </div>

            <h2 className="text-3xl font-bold text-[#1F1F1F] mb-4">
              {step.title}
            </h2>

            <p className="text-lg text-[#6B6B6B] mb-8">
              {step.description}
            </p>

            {currentStep === kycSteps.length - 1 && (
              <div className="space-y-3 w-full mb-8">
                <div className="flex items-center gap-3 text-left">
                  <CheckCircle className="w-5 h-5 text-[#328100] flex-shrink-0" />
                  <span className="text-[#1F1F1F]">Bank-level encryption</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <CheckCircle className="w-5 h-5 text-[#328100] flex-shrink-0" />
                  <span className="text-[#1F1F1F]">Fast approval (1-2 days)</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <CheckCircle className="w-5 h-5 text-[#328100] flex-shrink-0" />
                  <span className="text-[#1F1F1F]">One-time verification</span>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleNext}
          className="w-full py-4 bg-[#328100] text-white rounded-2xl font-medium hover:bg-[#2a6e00] transition-colors flex items-center justify-center gap-2"
        >
          {currentStep < kycSteps.length - 1 ? "Continue" : "Start Verification"}
          <ArrowRight className="w-5 h-5" />
        </button>

        {currentStep === kycSteps.length - 1 && (
          <button
            onClick={handleSkip}
            className="w-full py-3 text-[#6B6B6B] font-medium"
          >
            I'll do this later
          </button>
        )}
      </div>
    </div>
  );
}
