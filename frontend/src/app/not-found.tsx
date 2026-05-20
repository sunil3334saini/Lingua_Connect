import Link from "next/link";
import { Home, Search } from "lucide-react";
import type { Metadata } from "next";
import GoBackButton from "@/components/GoBackButton";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center space-y-6">
        {/* Large 404 heading */}
        <h1 className="text-8xl sm:text-9xl font-extrabold text-indigo-600 dark:text-indigo-400 select-none">
          404
        </h1>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Page not found
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It
            may have been moved or doesn&apos;t exist.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition"
          >
            <Home className="h-4 w-4" />
            Go home
          </Link>

          <Link
            href="/teachers"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition"
          >
            <Search className="h-4 w-4" />
            Browse teachers
          </Link>
        </div>

        {/* Back link */}
        <div className="pt-2">
          <GoBackButton />
        </div>
      </div>
    </div>
  );
}
