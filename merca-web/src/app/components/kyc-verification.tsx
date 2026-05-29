import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Upload, CheckCircle, Clock, AlertCircle, FileText, Camera } from "lucide-react";

export function KYCVerification() {
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState<"not_started" | "pending" | "approved" | "rejected">("not_started");
  const [selectedDocument, setSelectedDocument] = useState<"passport" | "drivers_license" | "national_id" | null>(null);
  const [frontUploaded, setFrontUploaded] = useState(false);
  const [backUploaded, setBackUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);

  const handleFileUpload = (type: "front" | "back" | "selfie") => {
    // Simulate file upload
    if (type === "front") setFrontUploaded(true);
    if (type === "back") setBackUploaded(true);
    if (type === "selfie") setSelfieUploaded(true);
  };

  const handleSubmit = () => {
    setKycStatus("pending");
    // In a real app, this would submit to the backend
    alert("KYC documents submitted for verification");
  };

  const canSubmit = selectedDocument && frontUploaded && (selectedDocument !== "passport" ? backUploaded : true) && selfieUploaded;

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] pb-6">
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/profile")} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-[#1F1F1F]" />
          </button>
          <h2 className="font-bold text-[#1F1F1F]">KYC Verification</h2>
          <div className="w-10"></div>
        </div>

        {kycStatus === "approved" && (
          <div className="bg-[#E8F5E0] border-2 border-[#328100] rounded-2xl p-5 flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-[#328100] flex-shrink-0" />
            <div>
              <h3 className="font-bold text-[#328100] mb-1">Verification Approved</h3>
              <p className="text-sm text-[#1F1F1F]">
                Your account is fully verified. You can now create invoices and access all features.
              </p>
            </div>
          </div>
        )}

        {kycStatus === "pending" && (
          <div className="bg-[#FFF4E5] border-2 border-[#FF9500] rounded-2xl p-5 flex items-start gap-3">
            <Clock className="w-6 h-6 text-[#FF9500] flex-shrink-0" />
            <div>
              <h3 className="font-bold text-[#FF9500] mb-1">Under Review</h3>
              <p className="text-sm text-[#1F1F1F]">
                Your documents are being reviewed. This typically takes 1-2 business days.
              </p>
            </div>
          </div>
        )}

        {kycStatus === "rejected" && (
          <div className="bg-[#FFE5E5] border-2 border-[#DC2626] rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-[#DC2626] flex-shrink-0" />
            <div>
              <h3 className="font-bold text-[#DC2626] mb-1">Verification Failed</h3>
              <p className="text-sm text-[#1F1F1F] mb-2">
                We couldn't verify your documents. Please try again with clearer images.
              </p>
              <button
                onClick={() => setKycStatus("not_started")}
                className="text-sm font-medium text-[#DC2626] underline"
              >
                Retry Verification
              </button>
            </div>
          </div>
        )}
      </div>

      {(kycStatus === "not_started" || kycStatus === "rejected") && (
        <div className="px-6 space-y-4">
          <div className="bg-white rounded-2xl p-5">
            <h3 className="font-bold text-[#1F1F1F] mb-3">Why KYC is Required</h3>
            <p className="text-sm text-[#6B6B6B] mb-4">
              To comply with financial regulations and create invoices, we need to verify your identity. This is a one-time process.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-[#328100]">
                <CheckCircle className="w-4 h-4" />
                <span>Secure and encrypted</span>
              </div>
              <div className="flex items-center gap-2 text-[#328100]">
                <CheckCircle className="w-4 h-4" />
                <span>Usually approved in 1-2 days</span>
              </div>
              <div className="flex items-center gap-2 text-[#328100]">
                <CheckCircle className="w-4 h-4" />
                <span>Required only once</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5">
            <h3 className="font-bold text-[#1F1F1F] mb-4">Select Document Type</h3>
            <div className="space-y-3">
              <button
                onClick={() => setSelectedDocument("passport")}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  selectedDocument === "passport"
                    ? "border-[#328100] bg-[#E8F5E0]"
                    : "border-[#E5E5E5] bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-[#328100]" />
                    <span className="font-medium text-[#1F1F1F]">Passport</span>
                  </div>
                  {selectedDocument === "passport" && (
                    <CheckCircle className="w-5 h-5 text-[#328100]" />
                  )}
                </div>
              </button>

              <button
                onClick={() => setSelectedDocument("drivers_license")}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  selectedDocument === "drivers_license"
                    ? "border-[#328100] bg-[#E8F5E0]"
                    : "border-[#E5E5E5] bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-[#328100]" />
                    <span className="font-medium text-[#1F1F1F]">Driver's License</span>
                  </div>
                  {selectedDocument === "drivers_license" && (
                    <CheckCircle className="w-5 h-5 text-[#328100]" />
                  )}
                </div>
              </button>

              <button
                onClick={() => setSelectedDocument("national_id")}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  selectedDocument === "national_id"
                    ? "border-[#328100] bg-[#E8F5E0]"
                    : "border-[#E5E5E5] bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-[#328100]" />
                    <span className="font-medium text-[#1F1F1F]">National ID</span>
                  </div>
                  {selectedDocument === "national_id" && (
                    <CheckCircle className="w-5 h-5 text-[#328100]" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {selectedDocument && (
            <>
              <div className="bg-white rounded-2xl p-5">
                <h3 className="font-bold text-[#1F1F1F] mb-4">Upload Documents</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => handleFileUpload("front")}
                    className={`w-full p-4 rounded-xl border-2 border-dashed transition-all ${
                      frontUploaded
                        ? "border-[#328100] bg-[#E8F5E0]"
                        : "border-[#E5E5E5] bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {frontUploaded ? (
                          <CheckCircle className="w-6 h-6 text-[#328100]" />
                        ) : (
                          <Upload className="w-6 h-6 text-[#6B6B6B]" />
                        )}
                        <div className="text-left">
                          <p className="font-medium text-[#1F1F1F]">
                            {selectedDocument === "passport" ? "Passport Photo Page" : "Front Side"}
                          </p>
                          <p className="text-sm text-[#6B6B6B]">
                            {frontUploaded ? "Uploaded" : "Click to upload"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>

                  {selectedDocument !== "passport" && (
                    <button
                      onClick={() => handleFileUpload("back")}
                      className={`w-full p-4 rounded-xl border-2 border-dashed transition-all ${
                        backUploaded
                          ? "border-[#328100] bg-[#E8F5E0]"
                          : "border-[#E5E5E5] bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {backUploaded ? (
                            <CheckCircle className="w-6 h-6 text-[#328100]" />
                          ) : (
                            <Upload className="w-6 h-6 text-[#6B6B6B]" />
                          )}
                          <div className="text-left">
                            <p className="font-medium text-[#1F1F1F]">Back Side</p>
                            <p className="text-sm text-[#6B6B6B]">
                              {backUploaded ? "Uploaded" : "Click to upload"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => handleFileUpload("selfie")}
                    className={`w-full p-4 rounded-xl border-2 border-dashed transition-all ${
                      selfieUploaded
                        ? "border-[#328100] bg-[#E8F5E0]"
                        : "border-[#E5E5E5] bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {selfieUploaded ? (
                          <CheckCircle className="w-6 h-6 text-[#328100]" />
                        ) : (
                          <Camera className="w-6 h-6 text-[#6B6B6B]" />
                        )}
                        <div className="text-left">
                          <p className="font-medium text-[#1F1F1F]">Selfie with Document</p>
                          <p className="text-sm text-[#6B6B6B]">
                            {selfieUploaded ? "Uploaded" : "Take a selfie"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`w-full py-4 rounded-2xl font-medium transition-all ${
                  canSubmit
                    ? "bg-[#328100] text-white hover:bg-[#2a6e00] shadow-lg shadow-[#328100]/20"
                    : "bg-[#E5E5E5] text-[#6B6B6B] cursor-not-allowed"
                }`}
              >
                Submit for Verification
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
