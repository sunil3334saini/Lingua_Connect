"use client";

import { ArrowLeft } from "lucide-react";

export default function GoBackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Go back
    </button>
  );
}
