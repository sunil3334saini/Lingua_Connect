"use client";

import ErrorFallback from "@/components/ErrorFallback";

/**
 * Catches runtime errors for every route segment under the root layout.
 * Next.js automatically wraps this in a React error boundary.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Something went wrong"
      message="An unexpected error occurred. Please try again or return to the home page."
    />
  );
}
