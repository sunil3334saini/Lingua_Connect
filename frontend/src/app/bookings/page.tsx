"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { Booking } from "@/types";
import { Calendar, Clock, Video, DollarSign, X, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function BookingsPage() {
  const { user, isAuthenticated, loadFromStorage } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
  }, [isAuthenticated, page, filter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const endpoint =
        user?.role === "teacher" ? "/bookings/teacher" : "/bookings/student";
      const params: Record<string, string | number> = { page, limit: 20 };
      if (filter !== "all") params.status = filter;
      const res = await api.get(endpoint, { params });
      setBookings(res.data.bookings);
      setTotalPages(res.data.pagination?.pages ?? 1);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await api.delete(`/bookings/${id}`);
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: "cancelled" } : b))
      );
      toast.success("Booking cancelled");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Could not cancel booking");
    } finally {
      setCancelling(null);
      setConfirmId(null);
    }
  };

  // Server already filters by status — use bookings directly
  const filtered = bookings;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Bookings</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "upcoming", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-4 py-2 text-sm rounded-lg font-medium capitalize ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
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
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700 animate-pulse"
            >
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
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
          {filtered.map((booking) => {
            const canCancel = !["completed", "cancelled"].includes(booking.status);
            const isConfirming = confirmId === booking._id;
            const isCancelling = cancelling === booking._id;

            return (
              <div
                key={booking._id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Clickable info area */}
                  <Link href={`/booking/${booking._id}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {booking.subject}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
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
                  </Link>

                  {/* Status badges + actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      {booking.paymentStatus === "paid" && booking.status === "upcoming" && (
                        <Link
                          href={`/call/${booking.meetingRoomId}`}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs flex items-center gap-1 transition"
                        >
                          <Video className="h-3 w-3" />
                          Join Call
                        </Link>
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

                    {/* Book Again — completed sessions, students only */}
                    {booking.status === "completed" && user?.role === "student" && (
                      <Link
                        href={`/teacher/${booking.teacherProfileId?._id}#book`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Book Again
                      </Link>
                    )}

                    {/* Cancel flow */}
                    {canCancel && (
                      isConfirming ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCancel(booking._id)}
                            disabled={isCancelling}
                            className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            {isCancelling ? "Cancelling…" : "Confirm cancel"}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(booking._id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Cancel
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm border dark:border-gray-600 rounded-lg disabled:opacity-40 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm border dark:border-gray-600 rounded-lg disabled:opacity-40 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
