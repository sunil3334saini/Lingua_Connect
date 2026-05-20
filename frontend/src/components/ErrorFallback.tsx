"use client";

import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorFallbackProps {
  /** The error that was thrown */
  error?: Error & { digest?: string };
  /** Callback to retry rendering the failed segment */
  reset?: () => void;
  /** Primary heading text */
  title?: string;
  /** Descriptive message below the heading */
  message?: string;
  /** Whether to show the "Go Home" link (default: true) */
  showHomeLink?: boolean;
}

/**
 * Reusable error UI used by `error.tsx`, `global-error.tsx`, and anywhere else
 * you need a user-friendly error fallback.
 */
export default function ErrorFallback({
  error,
  reset,
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again or return to the home page.",
  showHomeLink = true,
}: ErrorFallbackProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-10 w-10 text-red-500 dark:text-red-400" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
          {message}
        </p>

        {/* Error digest (dev-friendly, non-intrusive) */}
        {error?.digest && (
          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {reset && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition"
            >
              <RotateCcw className="h-4 w-4" />
              Try again
            </button>
          )}

          {showHomeLink && (
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition"
            >
              <Home className="h-4 w-4" />
              Go home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
