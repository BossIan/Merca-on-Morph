import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { SplashScreen } from "./components/splash-screen";
import { Onboarding } from "./components/onboarding";
import { LoginScreen } from "./components/login-screen";
import { SignupScreen } from "./components/signup-screen";
import { KYCOnboarding } from "./components/kyc-onboarding";
import { Dashboard } from "./components/dashboard";
import { QRPayment } from "./components/qr-payment";
import { Invoice } from "./components/invoice";
import { InvoiceList } from "./components/invoice-list";
import { InvoiceDetail } from "./components/invoice-detail";
import { Success } from "./components/success";
import { UnifiedPayments } from "./components/unified-payments";
import { HowItWorks } from "./components/how-it-works";
import { Wallet } from "./components/wallet";
import { Profile } from "./components/profile";
import { NotificationList } from "./components/notification-list";
import { KYCVerification } from "./components/kyc-verification";
import { CustomerPayment } from "./components/customer-payment";
import { CustomerSuccess } from "./components/customer-success";
import { CustomerReceipt } from "./components/customer-receipt";

export default function App() {
  return (
    <BrowserRouter>
      <div className="size-full">
        <Routes>
          {/* Onboarding & Auth */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignupScreen />} />
          <Route path="/kyc-onboarding" element={<KYCOnboarding />} />

          {/* Merchant Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/qr-payment" element={<QRPayment />} />
          <Route path="/invoice" element={<Invoice />} />
          <Route path="/invoice-list" element={<InvoiceList />} />
          <Route path="/invoice-detail" element={<InvoiceDetail />} />
          <Route path="/notifications" element={<NotificationList />} />
          <Route path="/success" element={<Success />} />
          <Route path="/unified-payments" element={<UnifiedPayments />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/kyc" element={<KYCVerification />} />

          {/* Customer-facing */}
          <Route path="/pay/:invoiceId" element={<CustomerPayment />} />
          <Route path="/customer-payment" element={<CustomerPayment />} />
          <Route path="/customer-success" element={<CustomerSuccess />} />
          <Route path="/customer-receipt" element={<CustomerReceipt />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}