"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { Booking } from "@/types";
import { Calendar, Clock, Video, DollarSign } from "lucide-react";

export default function BookingsPage() {
  const { user, isAuthenticated, loadFromStorage } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");
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

  const filtered =
    filter === "all"
      ? bookings
      : bookings.filter((b) => b.status === filter);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "upcoming", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm rounded-lg font-medium capitalize ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border hover:bg-gray-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 shadow-sm border animate-pulse"
            >
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400">No bookings found</p>
          {user?.role === "student" && (
            <Link
              href="/teachers"
              className="text-blue-600 hover:underline text-sm mt-2 inline-block"
            >
              Find a teacher
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <Link
              key={booking._id}
              href={`/booking/${booking._id}`}
              className="bg-white rounded-xl p-4 shadow-sm border block hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {booking.subject}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {user?.role === "student"
                      ? `Teacher: ${booking.teacherId?.name || "N/A"}`
                      : `Student: ${booking.studentId?.name || "N/A"}`}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(booking.sessionDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {booking.sessionTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />₹{booking.amount}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {booking.paymentStatus === "paid" &&
                    booking.status === "upcoming" && (
                      <span className="bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        Ready
                      </span>
                    )}
                  <span
                    className={`text-xs px-2 py-1 rounded-full capitalize ${
                      booking.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : booking.status === "cancelled"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {booking.status}
                  </span>
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
