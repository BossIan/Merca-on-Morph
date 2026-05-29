import { useNavigate } from "react-router";
import { ArrowLeft, Zap, Layers, Shield, DollarSign, Globe, Clock } from "lucide-react";

export function HowItWorks() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Layers,
      title: "Unified Payment Platform",
      description: "Accept payments from any source - credit cards, bank transfers, crypto wallets - all in one dashboard.",
      benefit: "No more switching between apps",
    },
    {
      icon: Zap,
      title: "Instant Settlement",
      description: "Stablecoin payments settle in seconds using blockchain technology. No 2-3 day waiting periods.",
      benefit: "Get your money immediately",
    },
    {
      icon: Globe,
      title: "Multi-Currency Support",
      description: "Accept USD, EUR, GBP, NGN, USDC, USDT, DAI, ETH, BTC and more. Auto-converts to your preferred currency.",
      benefit: "Serve global customers easily",
    },
    {
      icon: DollarSign,
      title: "Transparent Pricing",
      description: "Just 0.5% per transaction. No hidden fees, no monthly charges, no surprises.",
      benefit: "Keep more of what you earn",
    },
    {
      icon: Shield,
      title: "Secure & Compliant",
      description: "Bank-level security with blockchain transparency. All transactions are auditable and traceable.",
      benefit: "Peace of mind included",
    },
    {
      icon: Clock,
      title: "Real-Time Tracking",
      description: "Watch payments confirm instantly with live blockchain tracking. Know exactly when you get paid.",
      benefit: "Complete transparency",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] pb-6">
      <div className="bg-white px-6 pt-12 pb-6 rounded-b-3xl shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/dashboard")} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-[#1F1F1F]" />
          </button>
          <h2 className="font-bold text-[#1F1F1F]">How It Works</h2>
          <div className="w-10"></div>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-[#1F1F1F] mb-2">
            Simple, Fast, Transparent
          </h3>
          <p className="text-[#6B6B6B]">
            Built for modern merchants who need speed and simplicity
          </p>
        </div>
      </div>

      <div className="px-6 space-y-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="bg-white rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#E8F5E0] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-[#328100]" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-[#1F1F1F] mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-[#6B6B6B] mb-3">
                    {feature.description}
                  </p>
                  <div className="bg-[#E8F5E0] px-3 py-2 rounded-lg inline-block">
                    <p className="text-sm font-medium text-[#328100]">
                      ✓ {feature.benefit}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-6 mt-6">
        <div className="bg-gradient-to-br from-[#328100] to-[#2a6e00] rounded-2xl p-6 text-white">
          <h3 className="text-xl font-bold mb-2">Ready to get started?</h3>
          <p className="text-sm opacity-90 mb-4">
            Join thousands of merchants accepting faster payments
          </p>
          <button
            onClick={() => navigate("/qr-payment")}
            className="w-full py-3 bg-white text-[#328100] rounded-xl font-medium hover:bg-[#F5F5F5] transition-colors"
          >
            Receive Your First Payment
          </button>
        </div>
      </div>
    </div>
  );
}
