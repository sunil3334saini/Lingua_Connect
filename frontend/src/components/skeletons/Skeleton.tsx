"use client";

/**
 * Base Skeleton — the single animated pulse block everything else is built from.
 *
 * Usage:
 *   <Skeleton className="h-4 w-32" />           // one-off
 *   <Skeleton className="h-10 w-10 rounded-full" />  // avatar circle
 */
export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 ${className}`}
      aria-hidden="true"
    />
  );
}
