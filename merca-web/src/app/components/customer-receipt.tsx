import { useNavigate } from "react-router";
import { ArrowLeft, Download, Share2, CheckCircle } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import mercaLogo from "../../imports/BestFloatCompetition.png";

export function CustomerReceipt() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] pb-6">
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-[#1F1F1F]" />
          </button>
          <h2 className="font-bold text-[#1F1F1F]">Receipt</h2>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="px-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex justify-center mb-6">
            <ImageWithFallback
              src={mercaLogo}
              alt="Merca"
              className="w-32 h-auto"
            />
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-[#E8F5E0] px-4 py-2 rounded-full mb-4">
              <CheckCircle className="w-5 h-5 text-[#328100]" />
              <span className="font-medium text-[#328100]">Payment Confirmed</span>
            </div>
            <h1 className="text-4xl font-bold text-[#1F1F1F] mb-2">
              $2,450.00
            </h1>
            <p className="text-[#6B6B6B]">May 26, 2026 at 3:42 PM</p>
          </div>

          <div className="border-t border-b border-[#E5E5E5] py-6 mb-6">
            <h3 className="font-bold text-[#1F1F1F] mb-4">Payment Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Merchant</span>
                <span className="font-medium text-[#1F1F1F]">Acme Corp</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Invoice Number</span>
                <span className="font-medium text-[#1F1F1F]">INV-2024-001</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Description</span>
                <span className="font-medium text-[#1F1F1F] text-right max-w-[200px]">
                  Web Development Services
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Payment Method</span>
                <span className="font-medium text-[#1F1F1F]">USDC</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-[#6B6B6B]">Subtotal</span>
              <span className="font-medium text-[#1F1F1F]">$2,450.00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B6B6B]">Processing Fee (0.5%)</span>
              <span className="font-medium text-[#1F1F1F]">$12.25</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#E5E5E5]">
              <span className="font-bold text-[#1F1F1F]">Total Paid</span>
              <span className="font-bold text-xl text-[#328100]">$2,462.25</span>
            </div>
          </div>

          <div className="bg-[#F5F5F5] rounded-xl p-4 mb-6">
            <p className="text-xs text-[#6B6B6B] mb-2 font-medium">Transaction Hash</p>
            <p className="text-xs text-[#1F1F1F] font-mono break-all">
              0x7a9f2c8e1b4d3a5f6e9c2b1a8d4e7f3c5b2a9e6d1f8c3b7a4e2d9f1c8e5b3a6
            </p>
          </div>

          <div className="text-center text-xs text-[#6B6B6B]">
            <p className="mb-1">Payment processed by Merca</p>
            <p>For support, contact: support@merca.io</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button className="flex-1 py-3.5 bg-[#328100] text-white rounded-xl font-medium hover:bg-[#2a6e00] transition-colors flex items-center justify-center gap-2">
            <Download className="w-5 h-5" />
            Download PDF
          </button>
          <button className="flex-1 py-3.5 bg-white border-2 border-[#328100] text-[#328100] rounded-xl font-medium hover:bg-[#E8F5E0] transition-colors flex items-center justify-center gap-2">
            <Share2 className="w-5 h-5" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
