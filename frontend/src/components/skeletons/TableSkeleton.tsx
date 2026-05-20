"use client";

import Skeleton from "./Skeleton";

/**
 * Table / list skeleton — great for bookings lists, admin tables, etc.
 *
 * @param rows  Number of placeholder rows (default 5)
 * @param cols  Columns per row (default 4)
 */
export default function TableSkeleton({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header row */}
      <div className="grid gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-3/4" />
        ))}
      </div>

      {/* Body rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid gap-4 px-4 py-3 border-b border-gray-50 last:border-0"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className={`h-3 ${c === 0 ? "w-full" : "w-3/4"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
