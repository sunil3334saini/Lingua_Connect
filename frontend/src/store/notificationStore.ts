import { create } from "zustand";
import { Notification } from "@/types";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  /** Push a new notification (from socket or local action) */
  addNotification: (n: Omit<Notification, "id" | "read">) => void;
  /** Mark a single notification as read */
  markRead: (id: string) => void;
  /** Mark all as read */
  markAllRead: () => void;
  /** Remove a notification */
  dismiss: (id: string) => void;
  /** Clear all notifications */
  clearAll: () => void;
}

let nextId = 1;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (n) => {
    const notification: Notification = {
      ...n,
      id: String(nextId++),
      read: false,
    };
    set((s) => ({
      notifications: [notification, ...s.notifications].slice(0, 50), // cap at 50
      unreadCount: s.unreadCount + 1,
    }));
  },

  markRead: (id) => {
    const { notifications } = get();
    const target = notifications.find((n) => n.id === id);
    if (!target || target.read) return;
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
  },

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  dismiss: (id) =>
    set((s) => {
      const removed = s.notifications.find((n) => n.id === id);
      return {
        notifications: s.notifications.filter((n) => n.id !== id),
        unreadCount: removed && !removed.read ? s.unreadCount - 1 : s.unreadCount,
      };
    }),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
