"use client";

import { useEffect, useState } from "react";
import { DollarSign, FileText, Info, AlertCircle, X } from "lucide-react";
import { onToast, ToastNotification, NotificationType } from "../../hooks/useNotifications";

const icons: Record<NotificationType, { Icon: any; color: string; bg: string }> = {
  payment:  { Icon: DollarSign,  color: "#328100", bg: "#E8F5E0" },
  invoice:  { Icon: FileText,    color: "#2563EB", bg: "#EFF6FF" },
  system:   { Icon: Info,        color: "#6B6B6B", bg: "#F5F5F5" },
  security: { Icon: AlertCircle, color: "#FF9500", bg: "#FFF4E5" },
};

export function NotificationToast() {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  useEffect(() => {
    const unsub = onToast((notif) => {
      setToasts((prev) => [...prev, notif]);
      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== notif.id));
      }, 4000);
    });
    return unsub;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 left-0 right-0 z-50 px-4 space-y-2 pointer-events-none">
      {toasts.map((toast) => {
        const { Icon, color, bg } = icons[toast.type];
        return (
          <div
            key={toast.id}
            className="max-w-sm mx-auto bg-white rounded-2xl shadow-xl border border-[#E5E5E5] p-4 flex items-start gap-3 pointer-events-auto animate-in slide-in-from-top"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: bg }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#1F1F1F] text-sm">{toast.title}</p>
              <p className="text-xs text-[#6B6B6B] mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="p-1 hover:bg-[#F5F5F5] rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-[#6B6B6B]" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
