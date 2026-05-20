"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Mail, X } from "lucide-react";

/**
 * EmailVerificationBanner — shown at the top of any page when the
 * logged-in user's email is not yet verified.
 *
 * Usage: Drop <EmailVerificationBanner /> inside Providers or any layout.
 * It auto-hides if the user is not logged in or already verified.
 */
export default function EmailVerificationBanner() {
  const { user, isAuthenticated } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  // Don't render if not logged in, already verified, or dismissed
  if (
    !isAuthenticated ||
    !user ||
    user.isEmailVerified ||
    dismissed
  ) {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    try {
      await api.post("/auth/resend-verification");
      toast.success("Verification email sent! Check your inbox.");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-yellow-800">
          <Mail className="h-4 w-4 shrink-0" />
          <span>
            <strong>Verify your email</strong> — we sent a link to{" "}
            <span className="font-medium">{user.email}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResend}
            disabled={sending}
            className="text-xs font-medium bg-yellow-200 text-yellow-900 px-3 py-1 rounded-md hover:bg-yellow-300 disabled:opacity-50 transition"
          >
            {sending ? "Sending…" : "Resend email"}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-yellow-500 hover:text-yellow-700 transition"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
