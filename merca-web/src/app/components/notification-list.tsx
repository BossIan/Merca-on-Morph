import { useNavigate } from "react-router";
import {
    ArrowLeft, Bell, DollarSign, FileText,
    AlertCircle, Info, CheckCheck,
} from "lucide-react";
import { useState } from "react";
// Adjust based on where notification-list.tsx lives
import { useNotifications, NotificationType } from "../../hooks/useNotifications";
import { notifyToast } from "../../hooks/useNotifications";

const icons: Record<NotificationType, { Icon: any; color: string; bg: string }> = {
    payment: { Icon: DollarSign, color: "#328100", bg: "#E8F5E0" },
    invoice: { Icon: FileText, color: "#2563EB", bg: "#EFF6FF" },
    system: { Icon: Info, color: "#6B6B6B", bg: "#F5F5F5" },
    security: { Icon: AlertCircle, color: "#FF9500", bg: "#FFF4E5" },
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`
    if (mins > 0) return `${mins} min${mins > 1 ? "s" : ""} ago`
    return "Just now"
}

export function NotificationList() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<"all" | NotificationType>("all");
    const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    const filteredNotifications = notifications.filter(
        (n) => filter === "all" || n.type === filter
    );

    return (
        <div className="min-h-screen w-full bg-[#FAFAFA] pb-6">
            <div className="bg-white px-6 pt-12 pb-6 rounded-b-3xl shadow-sm mb-6">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => navigate("/dashboard")} className="p-2 -ml-2">
                        <ArrowLeft className="w-6 h-6 text-[#1F1F1F]" />
                    </button>
                    <h2 className="font-bold text-[#1F1F1F]">Notifications</h2>
                    {unreadCount > 0 ? (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-1 text-sm text-[#328100] font-medium"
                        >
                            <CheckCheck className="w-4 h-4" />
                            All read
                        </button>
                    ) : (
                        <div className="w-20" />
                    )}
                </div>

                {unreadCount > 0 && (
                    <div className="bg-[#E8F5E0] rounded-xl p-4 mb-4 flex items-center gap-3">
                        <Bell className="w-5 h-5 text-[#328100]" />
                        <p className="text-sm font-medium text-[#328100]">
                            {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
                        </p>
                    </div>
                )}

                <div className="flex gap-2 overflow-x-auto pb-2">
                    {(["all", "payment", "invoice", "system", "security"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors capitalize ${filter === f ? "bg-[#328100] text-white" : "bg-[#F5F5F5] text-[#6B6B6B]"
                                }`}
                        >
                            {f === "all" ? "All" : f === "payment" ? "Payments" : f === "invoice" ? "Invoices" : f === "system" ? "System" : "Security"}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center mt-20">
                    <div className="w-10 h-10 border-4 border-[#328100] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="px-6 space-y-3">
                    {filteredNotifications.map((notif) => {
                        const { Icon, color, bg } = icons[notif.type]
                        return (
                            <button
                                key={notif.id}
                                onClick={() => markAsRead(notif.id)}
                                className={`w-full bg-white rounded-2xl p-5 text-left transition-all hover:shadow-md ${notif.status === "unread" ? "border-2 border-[#328100]" : "border border-transparent"
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
                                        <Icon className="w-6 h-6" style={{ color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                            <h4 className="font-bold text-[#1F1F1F]">{notif.title}</h4>
                                            {notif.status === "unread" && (
                                                <div className="w-2 h-2 bg-[#328100] rounded-full flex-shrink-0 mt-1.5 ml-2" />
                                            )}
                                        </div>
                                        <p className="text-sm text-[#6B6B6B] mb-2">{notif.message}</p>
                                        <p className="text-xs text-[#6B6B6B]">{timeAgo(notif.created_at)}</p>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}

            {!loading && filteredNotifications.length === 0 && (
                <div className="px-6 mt-12 text-center">
                    <Bell className="w-16 h-16 text-[#E5E5E5] mx-auto mb-4" />
                    <h3 className="font-bold text-[#1F1F1F] mb-2">No notifications</h3>
                    <p className="text-[#6B6B6B]">You're all caught up! Check back later.</p>
                </div>
            )}
        </div>
    );
}