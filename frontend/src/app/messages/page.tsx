"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { MessageSquare, Clock } from "lucide-react";

interface Conversation {
  partnerId: string;
  partner: { name: string; profileImage?: string; role: string } | null;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  isMine: boolean;
}

export default function MessagesPage() {
  const { isAuthenticated, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    api
      .get("/messages/conversations")
      .then((r) => setConversations(r.data.conversations))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-blue-500" />
        Messages
      </h1>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
              <div className="h-11 w-11 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No conversations yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Start a chat from a teacher&apos;s profile page.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link
              key={conv.partnerId}
              href={`/messages/${conv.partnerId}`}
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 hover:shadow-md transition"
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                {conv.partner?.profileImage ? (
                  <img
                    src={conv.partner.profileImage}
                    alt=""
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-11 w-11 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {conv.partner?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
                {conv.unread > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {conv.unread > 9 ? "9+" : conv.unread}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`font-medium truncate ${conv.unread > 0 ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                    {conv.partner?.name || "Unknown"}
                  </p>
                  <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0 ml-2">
                    <Clock className="h-3 w-3" />
                    {new Date(conv.lastMessageAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <p className={`text-sm truncate mt-0.5 ${conv.unread > 0 ? "text-gray-700 dark:text-gray-200 font-medium" : "text-gray-400"}`}>
                  {conv.isMine ? "You: " : ""}{conv.lastMessage}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
