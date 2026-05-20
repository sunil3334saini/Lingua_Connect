import Link from "next/link";
import { WifiOff, Home, RefreshCw } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <WifiOff className="h-10 w-10 text-gray-400 dark:text-gray-500" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          You&apos;re offline
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
          It looks like you&apos;ve lost your internet connection. Please check
          your network and try again.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => typeof window !== "undefined" && window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition"
          >
            <Home className="h-4 w-4" />
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
