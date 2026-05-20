"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { getSocket } from "@/lib/socket";
import toast from "react-hot-toast";
import { Send, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Message {
  _id: string;
  senderId: string;
  senderName?: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface Partner {
  name: string;
  profileImage?: string;
  role: string;
}

export default function ChatPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const { user, isAuthenticated, loadFromStorage } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchMessages();
    fetchPartner();
  }, [isAuthenticated, userId]);

  // Subscribe to incoming private messages
  useEffect(() => {
    const socket = getSocket();
    const handler = (msg: Message) => {
      if (msg.senderId?.toString() === userId) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
    };
    socket.on("private_message", handler);
    return () => { socket.off("private_message", handler); };
  }, [userId]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/messages/${userId}`);
      setMessages(res.data.messages);
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const fetchPartner = async () => {
    try {
      const res = await api.get(`/auth/user/${userId}`);
      setPartner(res.data.user);
    } catch {
      // partner info optional
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  useEffect(() => {
    if (!loading) scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const res = await api.post("/messages", { receiverId: userId, message: trimmed });
      setMessages((prev) => [...prev, res.data.message]);
      setText("");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const myId = user?.id;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b dark:border-gray-700 mb-2 shrink-0">
        <Link href="/messages" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {partner?.profileImage ? (
          <img src={partner.profileImage} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="h-9 w-9 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
            {partner?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">
            {partner?.name || "Loading…"}
          </p>
          <p className="text-xs text-gray-400 capitalize">{partner?.role}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 py-2">
        {loading ? (
          <p className="text-center text-gray-400 text-sm mt-8">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-400 text-sm mt-8">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId?.toString() === myId;
            return (
              <div key={msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMine
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border dark:border-gray-700 rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  <p className={`text-xs mt-1 ${isMine ? "text-blue-200" : "text-gray-400"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 pt-3 border-t dark:border-gray-700 shrink-0">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          rows={1}
          maxLength={2000}
          className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl outline-none text-sm text-gray-900 dark:text-white dark:bg-gray-700 resize-none focus:ring-2 focus:ring-blue-500"
          style={{ minHeight: "42px", maxHeight: "120px" }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
