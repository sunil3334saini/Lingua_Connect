"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { TeacherAnalytics, Booking } from "@/types";
import {
  DollarSign,
  Users,
  Calendar,
  Star,
  TrendingUp,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  Video,
  BarChart3,
} from "lucide-react";

/* ─── Stat card (reusable) ──────────────────────────────────── */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
            {value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Simple bar (reusable) ─────────────────────────────────── */
function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-sm text-gray-600 dark:text-gray-300 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className="bg-indigo-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-10 text-right">
        {value}
      </span>
    </div>
  );
}

/* ─── Revenue chart (CSS bars) ──────────────────────────────── */
function RevenueChart({ data }: { data: TeacherAnalytics["monthlyRevenue"] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="flex items-end gap-1 sm:gap-2 h-48 w-full">
      {data.map((item, i) => {
        const height = (item.revenue / maxRevenue) * 100;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end gap-1 group"
          >
            {/* Tooltip */}
            <div className="hidden group-hover:block text-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-2 py-1 rounded shadow whitespace-nowrap">
              ₹{item.revenue.toLocaleString()} · {item.sessions} sessions
            </div>
            <div
              className="w-full bg-indigo-500 dark:bg-indigo-400 rounded-t transition-all duration-500 min-h-[2px]"
              style={{ height: `${Math.max(height, 2)}%` }}
            />
            <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-full">
              {item.month}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────── */
export default function TeacherAnalyticsPage() {
  const { user, isAuthenticated, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<TeacherAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user?.role !== "teacher") {
      router.push("/dashboard");
      return;
    }
    fetchAnalytics();
  }, [isAuthenticated, user]);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get("/teacher/analytics");
      setData(res.data.analytics);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || user?.role !== "teacher") return null;

  /* ── Loading skeleton ───────────────────────────────────────── */
  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
            />
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
      </div>
    );
  }

  const { overview, monthlyRevenue, subjectBreakdown, ratingDistribution, recentReviews, upcomingSessions } = data;
  const maxSubjectCount = Math.max(...subjectBreakdown.map((s) => s.count), 1);
  const maxRating = Math.max(...ratingDistribution, 1);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your teaching performance and earnings
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          &larr; Back to dashboard
        </Link>
      </div>

      {/* ── Overview stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Revenue" value={`₹${overview.totalRevenue.toLocaleString()}`} color="bg-green-500" />
        <StatCard icon={Users} label="Total Students" value={overview.totalStudents} color="bg-blue-500" />
        <StatCard icon={Calendar} label="Total Bookings" value={overview.totalBookings} color="bg-purple-500" />
        <StatCard icon={Star} label="Average Rating" value={overview.averageRating.toFixed(1)} color="bg-yellow-500" />
        <StatCard icon={CheckCircle} label="Completed" value={overview.completedBookings} color="bg-emerald-500" />
        <StatCard icon={Clock} label="Upcoming" value={overview.upcomingBookings} color="bg-indigo-500" />
        <StatCard icon={XCircle} label="Cancelled" value={overview.cancelledBookings} color="bg-red-500" />
        <StatCard icon={TrendingUp} label="Completion Rate" value={`${overview.completionRate}%`} color="bg-teal-500" />
      </div>

      {/* ── Revenue chart ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Monthly Revenue (Last 12 Months)
        </h2>
        <RevenueChart data={monthlyRevenue} />
      </div>

      {/* Two-column: Subjects + Ratings */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Subject breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-500" />
            Subjects
          </h2>
          {subjectBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400">No bookings yet</p>
          ) : (
            <div className="space-y-3">
              {subjectBreakdown.map((s) => (
                <div key={s._id}>
                  <Bar value={s.count} max={maxSubjectCount} label={s._id} />
                  <p className="text-xs text-gray-400 dark:text-gray-500 ml-[92px]">
                    ₹{s.revenue.toLocaleString()} earned
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rating distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Ratings ({overview.totalReviews} reviews)
          </h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => (
              <Bar
                key={star}
                value={ratingDistribution[star - 1]}
                max={maxRating}
                label={`${star} ★`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Two-column: Recent reviews + Upcoming sessions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent reviews */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Reviews
          </h2>
          {recentReviews.length === 0 ? (
            <p className="text-sm text-gray-400">No reviews yet</p>
          ) : (
            <div className="space-y-4">
              {recentReviews.map((review) => (
                <div key={review._id} className="flex gap-3">
                  <div className="shrink-0 h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-sm font-bold overflow-hidden">
                    {review.studentId?.profileImage ? (
                      <img src={review.studentId.profileImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      review.studentId?.name?.charAt(0)?.toUpperCase() || "S"
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {review.studentId?.name || "Student"}
                      </span>
                      <span className="text-xs text-yellow-500">
                        {"★".repeat(review.rating)}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-0.5">
                        {review.comment}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming sessions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Upcoming Sessions (Next 7 Days)
          </h2>
          {upcomingSessions.length === 0 ? (
            <p className="text-sm text-gray-400">No upcoming sessions</p>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((booking: Booking) => (
                <div
                  key={booking._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {booking.subject}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(booking.sessionDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {booking.sessionTime}
                      </span>
                    </div>
                  </div>
                  {booking.paymentStatus === "paid" && (
                    <Link
                      href={`/call/${booking.meetingRoomId}`}
                      className="shrink-0 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-green-700 transition"
                    >
                      <Video className="h-3 w-3" />
                      Join
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
