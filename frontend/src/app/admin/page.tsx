"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { AdminStats } from "@/types";
import {
  Users,
  GraduationCap,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-700",
  ongoing: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/admin/stats");
        setStats(res.data.stats);
      } catch {
        // handled by interceptor
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    );
  }

  if (!stats) return <p className="text-gray-500">Failed to load stats.</p>;

  const cards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600 bg-blue-50",
      sub: `${stats.userBreakdown.students} students · ${stats.userBreakdown.teachers} teachers`,
    },
    {
      label: "Teachers",
      value: stats.totalTeachers,
      icon: GraduationCap,
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Bookings",
      value: stats.totalBookings,
      icon: Calendar,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Revenue",
      value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`,
      icon: DollarSign,
      color: "text-yellow-600 bg-yellow-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Overview of your platform metrics
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4 flex items-start gap-3"
            >
              <div
                className={`p-2 rounded-lg ${card.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                  {card.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</p>
                {card.sub && (
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    {card.sub}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking status breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Bookings by Status
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {Object.entries(stats.bookingsByStatus).map(([status, count]) => (
            <div
              key={status}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                STATUS_COLORS[status] || "bg-gray-100 text-gray-700"
              }`}
            >
              {status}: {count}
            </div>
          ))}
          {Object.keys(stats.bookingsByStatus).length === 0 && (
            <p className="text-sm text-gray-400">No bookings yet</p>
          )}
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Recent Bookings
          </h2>
          <Link
            href="/admin/bookings"
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {stats.recentBookings.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            No bookings yet
          </p>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-2 font-medium">Student</th>
                  <th className="px-5 py-2 font-medium">Teacher</th>
                  <th className="px-5 py-2 font-medium">Subject</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-5 py-2.5 text-gray-800 dark:text-gray-200">
                      {b.studentId?.name ?? "—"}
                    </td>
                    <td className="px-5 py-2.5 text-gray-800 dark:text-gray-200">
                      {b.teacherId?.name ?? "—"}
                    </td>
                    <td className="px-5 py-2.5 text-gray-600 dark:text-gray-400">{b.subject}</td>
                    <td className="px-5 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          STATUS_COLORS[b.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 font-medium text-gray-900 dark:text-white">
                      ₹{b.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
