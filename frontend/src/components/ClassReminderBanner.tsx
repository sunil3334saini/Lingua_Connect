"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { connectSocket } from "@/lib/socket";
import { Bell, Video, X } from "lucide-react";

interface ClassReminder {
  id: string;
  message: string;
  meetingRoomId: string;
  sessionTime: string;
  bookingId: string;
  timestamp: string;
}

export default function ClassReminderBanner() {
  const { user, isAuthenticated } = useAuthStore();
  const [reminders, setReminders] = useState<ClassReminder[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const socket = connectSocket(user.id);

    const handler = (data: any) => {
      if (data.type === "class_reminder") {
        setReminders((prev) => {
          // Deduplicate by bookingId
          if (prev.some((r) => r.bookingId === data.bookingId)) return prev;
          return [
            ...prev,
            {
              id: `${data.bookingId}-${Date.now()}`,
              message: data.message,
              meetingRoomId: data.meetingRoomId,
              sessionTime: data.sessionTime,
              bookingId: data.bookingId,
              timestamp: data.timestamp,
            },
          ];
        });
      }
    };

    socket.on(`notification_${user.id}`, handler);
    return () => {
      socket.off(`notification_${user.id}`, handler);
    };
  }, [isAuthenticated, user?.id]);

  const dismiss = useCallback((id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }, []);

  if (reminders.length === 0) return null;

  return (
    <div className="space-y-2 px-4 py-2">
      {reminders.map((reminder) => (
        <div
          key={reminder.id}
          className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg px-4 py-3 animate-in slide-in-from-top"
        >
          <Bell className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 animate-bounce" />
          <p className="flex-1 text-sm text-indigo-800 dark:text-indigo-200 font-medium">
            {reminder.message}
          </p>
          <Link
            href={`/call/${reminder.meetingRoomId}`}
            className="shrink-0 inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          >
            <Video className="h-3.5 w-3.5" />
            Join Now
          </Link>
          <button
            onClick={() => dismiss(reminder.id)}
            className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
            aria-label="Dismiss reminder"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
