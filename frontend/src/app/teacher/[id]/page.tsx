"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { TeacherProfile, Review } from "@/types";
import toast from "react-hot-toast";
import {
  Star,
  Clock,
  Calendar,
  DollarSign,
  MessageSquare,
  Video,
} from "lucide-react";

export default function TeacherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking form
  const [showBooking, setShowBooking] = useState(false);
  const [bookingSubject, setBookingSubject] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingDuration, setBookingDuration] = useState(60);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchTeacher();
    fetchReviews();
  }, [params.id]);

  const fetchTeacher = async () => {
    try {
      const res = await api.get(`/teacher/${params.id}`);
      setTeacher(res.data.teacher);
      if (res.data.teacher.subjects.length > 0) {
        setBookingSubject(res.data.teacher.subjects[0]);
      }
    } catch {
      toast.error("Teacher not found");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/reviews/${params.id}`);
      setReviews(res.data.reviews);
    } catch {
      // ignore
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setBookingLoading(true);
    try {
      const res = await api.post("/bookings", {
        teacherProfileId: teacher?._id,
        subject: bookingSubject,
        sessionDate: bookingDate,
        sessionTime: bookingTime,
        duration: bookingDuration,
      });

      toast.success("Booking created! Proceed to payment.");
      router.push(`/booking/${res.data.booking._id}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400 text-lg">Teacher not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Teacher Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl flex-shrink-0">
            {teacher.userId?.name?.charAt(0)?.toUpperCase() || "T"}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {teacher.userId?.name}
            </h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium text-gray-900">
                  {teacher.rating.toFixed(1)}
                </span>
                <span className="text-gray-400">
                  ({teacher.totalReviews} reviews)
                </span>
              </span>
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                {teacher.experience} years experience
              </span>
              <span className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                <DollarSign className="h-4 w-4 text-green-500" />₹
                {teacher.price}/hr
              </span>
            </div>

            {/* Subjects */}
            <div className="flex flex-wrap gap-2 mt-3">
              {teacher.subjects.map((sub, i) => (
                <span
                  key={i}
                  className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full"
                >
                  {sub}
                </span>
              ))}
            </div>

            {/* Bio */}
            {teacher.bio && (
              <p className="text-gray-600 mt-4 text-sm leading-relaxed">
                {teacher.bio}
              </p>
            )}
          </div>
        </div>

        {/* Availability */}
        {teacher.availability.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Availability
            </h3>
            <div className="flex flex-wrap gap-2">
              {teacher.availability.map((slot, i) => (
                <span
                  key={i}
                  className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg"
                >
                  {slot.day}: {slot.startTime} - {slot.endTime}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {user?.role === "student" && (
          <div className="mt-6 pt-4 border-t flex gap-3">
            <button
              onClick={() => setShowBooking(!showBooking)}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Video className="h-4 w-4" />
              Book Session
            </button>
          </div>
        )}
      </div>

      {/* Booking Form */}
      {showBooking && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Book a Session
          </h2>
          <form onSubmit={handleBooking} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <select
                  value={bookingSubject}
                  onChange={(e) => setBookingSubject(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none text-gray-900"
                >
                  {teacher.subjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <select
                  value={bookingDuration}
                  onChange={(e) =>
                    setBookingDuration(parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none text-gray-900"
                >
                  <option value={30}>30 min</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none text-gray-900"
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              Estimated cost:{" "}
              <span className="font-semibold text-gray-900">
                ₹{teacher.price * (bookingDuration / 60)}
              </span>
            </div>

            <button
              type="submit"
              disabled={bookingLoading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {bookingLoading ? "Creating booking..." : "Confirm Booking"}
            </button>
          </form>
        </div>
      )}

      {/* Reviews */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Reviews ({teacher.totalReviews})
        </h2>
        {reviews.length === 0 ? (
          <p className="text-gray-400 text-sm">No reviews yet</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="border-b last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 text-sm">
                    {review.studentId?.name || "Student"}
                  </span>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < review.rating
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(review.createdAt!).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-gray-600 text-sm">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
