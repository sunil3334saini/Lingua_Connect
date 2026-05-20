"use client";

import Skeleton from "./Skeleton";

/**
 * Card skeleton — reusable for teacher cards, booking cards, etc.
 *
 * @param lines   Number of text lines to show (default 3)
 * @param hasImage  Show a top image placeholder (default true)
 */
export default function CardSkeleton({
  lines = 3,
  hasImage = true,
}: {
  lines?: number;
  hasImage?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {hasImage && <Skeleton className="h-40 w-full rounded-none" />}
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-3 ${i === lines - 1 ? "w-1/2" : "w-full"}`}
          />
        ))}
      </div>
    </div>
  );
}
