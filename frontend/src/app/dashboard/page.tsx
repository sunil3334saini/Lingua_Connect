"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-500 text-sm mt-1 capitalize">
          {user?.role} Dashboard
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {upcomingBookings.length}
              </p>
              <p className="text-xs text-gray-500">Upcoming</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {completedBookings.length}
              </p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                ₹{bookings.filter((b) => b.paymentStatus === "paid").reduce((s, b) => s + b.amount, 0)}
              </p>
              <p className="text-xs text-gray-500">
                {user?.role === "teacher" ? "Earned" : "Spent"}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {bookings.length}
              </p>
              <p className="text-xs text-gray-500">Total Sessions</p>
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
              className="bg-white border rounded-xl p-5 hover:shadow-md transition text-gray-900"
            >
              <Calendar className="h-6 w-6 mb-2 text-blue-600" />
              <span className="font-semibold">My Bookings</span>
              <p className="text-sm text-gray-500 mt-1">
                View upcoming and past sessions
              </p>
            </Link>
            <Link
              href="/profile"
              className="bg-white border rounded-xl p-5 hover:shadow-md transition text-gray-900"
            >
              <Star className="h-6 w-6 mb-2 text-yellow-500" />
              <span className="font-semibold">My Profile</span>
              <p className="text-sm text-gray-500 mt-1">
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
              className="bg-white border rounded-xl p-5 hover:shadow-md transition text-gray-900"
            >
              <Calendar className="h-6 w-6 mb-2 text-blue-600" />
              <span className="font-semibold">My Sessions</span>
              <p className="text-sm text-gray-500 mt-1">
                View scheduled sessions
              </p>
            </Link>
            <Link
              href="/profile"
              className="bg-white border rounded-xl p-5 hover:shadow-md transition text-gray-900"
            >
              <Star className="h-6 w-6 mb-2 text-yellow-500" />
              <span className="font-semibold">My Profile</span>
              <p className="text-sm text-gray-500 mt-1">
                Update personal details
              </p>
            </Link>
          </>
        )}
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
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
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
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
