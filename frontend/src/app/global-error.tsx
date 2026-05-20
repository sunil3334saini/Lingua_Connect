"use client";

import ErrorFallback from "@/components/ErrorFallback";

/**
 * Catches unhandled errors that bubble past the root layout itself.
 * Must render its own <html> + <body> because the root layout is unavailable.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white antialiased">
        <ErrorFallback
          error={error}
          reset={reset}
          title="Critical error"
          message="The application encountered a critical error. Please try refreshing the page."
        />
      </body>
    </html>
  );
}
