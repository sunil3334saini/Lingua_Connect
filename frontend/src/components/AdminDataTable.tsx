"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import api from "@/lib/api";
import { Pagination } from "@/types";
import { ChevronLeft, ChevronRight, Search, RefreshCw } from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────────── */

export interface Column<T> {
  key: string;
  label: string;
  /** Custom cell renderer. Falls back to row[key] as string. */
  render?: (row: T) => ReactNode;
  /** Extra classes for the th/td (e.g. "hidden sm:table-cell"). */
  className?: string;
}

interface AdminDataTableProps<T> {
  /** Visible title above the table */
  title: string;
  /** API endpoint, e.g. "/admin/users" */
  endpoint: string;
  /** The key in the response JSON that holds the rows array */
  dataKey: string;
  /** Column definitions */
  columns: Column<T>[];
  /** Optional filters displayed above the table */
  filters?: ReactNode;
  /** Extra query-string params merged with page/limit */
  queryParams?: Record<string, string>;
  /** Items per page (default 10) */
  pageSize?: number;
  /** Optional row actions column renderer */
  rowActions?: (row: T) => ReactNode;
  /** Called after rows are fetched — lets parent react to data (e.g. update counts) */
  onDataLoaded?: (rows: T[], pagination: Pagination) => void;
  /** Ref-like trigger: increment to force refetch */
  refreshKey?: number;
}

/* ────────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────────── */

export default function AdminDataTable<T extends { _id?: string; id?: string }>({
  title,
  endpoint,
  dataKey,
  columns,
  filters,
  queryParams = {},
  pageSize = 10,
  rowActions,
  onDataLoaded,
  refreshKey = 0,
}: AdminDataTableProps<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: pageSize,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const params: Record<string, string> = {
          page: String(page),
          limit: String(pageSize),
          ...queryParams,
        };
        if (search.trim()) params.search = search.trim();

        const res = await api.get(endpoint, { params });
        const data = res.data[dataKey] as T[];
        const pag = res.data.pagination as Pagination;

        setRows(data);
        setPagination(pag);
        onDataLoaded?.(data, pag);
      } catch {
        // silent — interceptor handles 401/500
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [endpoint, dataKey, pageSize, JSON.stringify(queryParams), search, refreshKey]
  );

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const goPage = (p: number) => fetchData(p);

  const getRowKey = (row: T, i: number): string =>
    (row as Record<string, unknown>)._id as string ??
    (row as Record<string, unknown>).id as string ??
    String(i);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 text-gray-900 dark:text-white dark:bg-gray-700"
            />
          </div>
          <button
            onClick={() => fetchData(pagination.page)}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filters slot */}
      {filters}

      {/* Table wrapper */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 font-medium whitespace-nowrap ${col.className ?? ""}`}
                  >
                    {col.label}
                  </th>
                ))}
                {rowActions && (
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading
                ? Array.from({ length: pageSize }).map((_, i) => (
                    <tr key={`skel-${i}`} className="animate-pulse">
                      {columns.map((col) => (
                        <td key={col.key} className={`px-4 py-3 ${col.className ?? ""}`}>
                          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
                        </td>
                      ))}
                      {rowActions && (
                        <td className="px-4 py-3">
                          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-10 ml-auto" />
                        </td>
                      )}
                    </tr>
                  ))
                : rows.map((row, i) => (
                    <tr key={getRowKey(row, i)} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-4 py-3 text-gray-800 dark:text-gray-200 ${col.className ?? ""}`}
                        >
                          {col.render
                            ? col.render(row)
                            : String(
                                (row as Record<string, unknown>)[col.key] ?? "—"
                              )}
                        </td>
                      ))}
                      {rowActions && (
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {rowActions(row)}
                        </td>
                      )}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {!loading && rows.length === 0 && (
          <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
            No records found
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
            <span>
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === pagination.pages ||
                    Math.abs(p - pagination.page) <= 1
                )
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "…" ? (
                    <span key={`gap-${idx}`} className="px-1 text-gray-400">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goPage(p as number)}
                      className={`min-w-8 h-8 rounded text-sm font-medium transition ${
                        p === pagination.page
                          ? "bg-blue-600 text-white"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => goPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
