"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { Booking } from "@/types";
import {
  Calendar,
  Clock,
  Video,
  BookOpen,
  DollarSign,
  Star,
  Users,
  BarChart3,
  Timer,
} from "lucide-react";

function useCountdown(targetDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!targetDate) { setTimeLeft(null); return; }

    const tick = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Starting now"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setTimeLeft(`${d}d ${h}h ${m}m`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m ${s}s`);
      else setTimeLeft(`${m}m ${s}s`);
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [targetDate]);

  return timeLeft;
}

export default function DashboardPage() {
  const { user, isAuthenticated, loadFromStorage } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchBookings();
  }, [isAuthenticated]);

  const fetchBookings = async () => {
    try {
      const endpoint =
        user?.role === "teacher" ? "/bookings/teacher" : "/bookings/student";
      const res = await api.get(endpoint);
      setBookings(res.data.bookings);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  const upcomingBookings = bookings.filter((b) => b.status === "upcoming");
  const completedBookings = bookings.filter((b) => b.status === "completed");

  // Next paid upcoming session sorted by date+time
  const nextSession = upcomingBookings
    .filter((b) => b.paymentStatus === "paid")
    .sort((a, b) => {
      const da = new Date(`${a.sessionDate.slice(0, 10)}T${a.sessionTime}`);
      const db = new Date(`${b.sessionDate.slice(0, 10)}T${b.sessionTime}`);
      return da.getTime() - db.getTime();
    })[0] ?? null;

  const nextSessionDate = nextSession
    ? new Date(`${nextSession.sessionDate.slice(0, 10)}T${nextSession.sessionTime}`)
    : null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const countdown = useCountdown(nextSessionDate);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 capitalize">
          {user?.role} Dashboard
        </p>
      </div>

      {/* Next session countdown banner */}
      {countdown && nextSession && (
        <div className="mb-6 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl px-5 py-3">
          <div className="flex items-center gap-3">
            <Timer className="h-5 w-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                Next session in {countdown}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {nextSession.subject} · {nextSession.sessionTime}
              </p>
            </div>
          </div>
          <Link
            href={`/call/${nextSession.meetingRoomId}`}
            className="text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
          >
            <Video className="h-3 w-3" />
            Join
          </Link>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {upcomingBookings.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Upcoming</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {completedBookings.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{bookings.filter((b) => b.paymentStatus === "paid").reduce((s, b) => s + b.amount, 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role === "teacher" ? "Earned" : "Spent"}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {bookings.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Sessions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {user?.role === "student" ? (
          <>
            <Link
              href="/teachers"
              className="bg-blue-600 text-white rounded-xl p-5 hover:bg-blue-700 transition"
            >
              <Users className="h-6 w-6 mb-2" />
              <span className="font-semibold">Find Teachers</span>
              <p className="text-sm text-blue-200 mt-1">
                Search by subject, rating, or price
              </p>
            </Link>
            <Link
              href="/bookings"
              className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition text-gray-900 dark:text-white"
            >
              <Calendar className="h-6 w-6 mb-2 text-blue-600" />
              <span className="font-semibold">My Bookings</span>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                View upcoming and past sessions
              </p>
            </Link>
            <Link
              href="/profile"
              className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition text-gray-900 dark:text-white"
            >
              <Star className="h-6 w-6 mb-2 text-yellow-500" />
              <span className="font-semibold">My Profile</span>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Update your personal details
              </p>
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/teacher/setup"
              className="bg-blue-600 text-white rounded-xl p-5 hover:bg-blue-700 transition"
            >
              <BookOpen className="h-6 w-6 mb-2" />
              <span className="font-semibold">My Teaching Profile</span>
              <p className="text-sm text-blue-200 mt-1">
                Update subjects, pricing & availability
              </p>
            </Link>
            <Link
              href="/bookings"
              className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition text-gray-900 dark:text-white"
            >
              <Calendar className="h-6 w-6 mb-2 text-blue-600" />
              <span className="font-semibold">My Sessions</span>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                View scheduled sessions
              </p>
            </Link>
            <Link
              href="/profile"
              className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition text-gray-900 dark:text-white"
            >
              <Star className="h-6 w-6 mb-2 text-yellow-500" />
              <span className="font-semibold">My Profile</span>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Update personal details
              </p>
            </Link>
            <Link
              href="/teacher/analytics"
              className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition text-gray-900 dark:text-white"
            >
              <BarChart3 className="h-6 w-6 mb-2 text-indigo-600" />
              <span className="font-semibold">Analytics</span>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Revenue, ratings & insights
              </p>
            </Link>
          </>
        )}
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upcoming Sessions
        </h2>
        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : upcomingBookings.length === 0 ? (
          <p className="text-gray-400 text-sm">No upcoming sessions</p>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.slice(0, 5).map((booking) => (
              <div
                key={booking._id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {booking.subject}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
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
                <div className="flex items-center gap-2">
                  {booking.paymentStatus === "paid" && (
                    <Link
                      href={`/call/${booking.meetingRoomId}`}
                      className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-green-700"
                    >
                      <Video className="h-3 w-3" />
                      Join
                    </Link>
                  )}
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      booking.paymentStatus === "paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {booking.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
