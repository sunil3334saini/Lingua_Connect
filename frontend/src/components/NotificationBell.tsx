"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { connectSocket } from "@/lib/socket";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Info,
  Calendar,
  DollarSign,
  Star,
  MessageSquare,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   Icon mapper – pick an icon based on notification type
   ──────────────────────────────────────────────────────────────── */

const ICON_MAP: Record<string, React.ElementType> = {
  booking: Calendar,
  payment: DollarSign,
  review: Star,
  message: MessageSquare,
};

function NotificationIcon({ type }: { type: string }) {
  const Icon = ICON_MAP[type] || Info;
  return <Icon className="h-4 w-4 shrink-0 text-blue-500" />;
}

/* ────────────────────────────────────────────────────────────────
   NotificationBell
   ──────────────────────────────────────────────────────────────── */

export default function NotificationBell() {
  const { user, isAuthenticated } = useAuthStore();
  const {
    notifications,
    unreadCount,
    addNotification,
    markRead,
    markAllRead,
    dismiss,
    clearAll,
  } = useNotificationStore();

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  /* ── Connect to socket and listen for notifications ────────── */
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socket = connectSocket(user.id);

    const handler = (data: { type: string; message: string; timestamp: string }) => {
      addNotification({
        type: data.type,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
      });
    };

    socket.on("notification", handler);
    return () => {
      socket.off("notification", handler);
    };
  }, [isAuthenticated, user, addNotification]);

  /* ── Close panel on click outside ──────────────────────────── */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  /* ── Close on Escape ───────────────────────────────────────── */
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Read all
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition"
                  title="Clear all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 transition ${
                    n.read ? "bg-white dark:bg-gray-800" : "bg-blue-50/60 dark:bg-blue-900/20"
                  } hover:bg-gray-50 dark:hover:bg-gray-700/50`}
                >
                  <NotificationIcon type={n.type} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                      {n.message}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {formatRelative(n.timestamp)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    {!n.read && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="p-1 rounded text-blue-500 hover:bg-blue-100 transition"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => dismiss(n.id)}
                      className="p-1 rounded text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                      title="Dismiss"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Helper: relative time string
   ──────────────────────────────────────────────────────────────── */

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffS = Math.floor((now - then) / 1000);

  if (diffS < 60) return "Just now";
  if (diffS < 3600) return `${Math.floor(diffS / 60)}m ago`;
  if (diffS < 86400) return `${Math.floor(diffS / 3600)}h ago`;
  if (diffS < 604800) return `${Math.floor(diffS / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
