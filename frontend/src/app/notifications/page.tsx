"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  Info,
  Calendar,
  DollarSign,
  Star,
  MessageSquare,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  booking: Calendar,
  payment: DollarSign,
  review: Star,
  message: MessageSquare,
};

function NotificationIcon({ type }: { type: string }) {
  const Icon = ICON_MAP[type] || Info;
  return <Icon className="h-5 w-5 shrink-0 text-blue-500" />;
}

function formatRelative(iso: string): string {
  const diffS = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffS < 60) return "Just now";
  if (diffS < 3600) return `${Math.floor(diffS / 60)}m ago`;
  if (diffS < 86400) return `${Math.floor(diffS / 3600)}h ago`;
  if (diffS < 604800) return `${Math.floor(diffS / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function NotificationsPage() {
  const { isAuthenticated, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const { notifications, unreadCount, markRead, markAllRead, dismiss, clearAll } =
    useNotificationStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Bell className="h-6 w-6 text-blue-500" />
          Notifications
          {unreadCount > 0 && (
            <span className="text-sm font-medium bg-red-500 text-white px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </h1>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-gray-400 hover:text-red-500 flex items-center gap-1.5 transition"
            >
              <Trash2 className="h-4 w-4" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="h-14 w-14 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No notifications yet</p>
          <p className="text-sm text-gray-400 mt-1">
            You&apos;ll see booking updates, payment confirmations, and more here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 p-4 rounded-xl border transition ${
                n.read
                  ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
              }`}
            >
              <NotificationIcon type={n.type} />

              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                  {n.message}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {formatRelative(n.timestamp)}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!n.read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => dismiss(n.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  title="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
