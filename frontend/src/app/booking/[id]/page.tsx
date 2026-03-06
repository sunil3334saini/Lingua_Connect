"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Booking } from "@/types";
import toast from "react-hot-toast";
import {
  Calendar,
  Clock,
  DollarSign,
  Video,
  CheckCircle,
  XCircle,
} from "lucide-react";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, loadFromStorage } = useAuthStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchBooking();
  }, [isAuthenticated, params.id]);

  const fetchBooking = async () => {
    try {
      const res = await api.get(`/bookings/${params.id}`);
      setBooking(res.data.booking);
    } catch {
      toast.error("Booking not found");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setPayLoading(true);
    try {
      // Create Razorpay order
      const orderRes = await api.post("/payments/create-order", {
        bookingId: booking?._id,
      });

      const { order, key } = orderRes.data;

      // Load Razorpay script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);

      script.onload = () => {
        const options: RazorpayOptions = {
          key,
          amount: order.amount,
          currency: order.currency,
          name: "Lingua Connect",
          description: `Session: ${booking?.subject}`,
          order_id: order.id,
          handler: async (response: RazorpayResponse) => {
            try {
              await api.post("/payments/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: booking?._id,
              });
              toast.success("Payment successful!");
              fetchBooking(); // Refresh booking
            } catch {
              toast.error("Payment verification failed");
            }
          },
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
            contact: user?.phone || "",
          },
          theme: { color: "#2563EB" },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Payment failed");
    } finally {
      setPayLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400">Booking not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Booking Details
      </h1>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        {/* Subject */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {booking.subject}
          </h2>
          <p className="text-sm text-gray-500">
            with{" "}
            {user?.role === "student"
              ? booking.teacherId?.name
              : booking.studentId?.name}
          </p>
        </div>

        {/* Session Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-blue-500" />
            {new Date(booking.sessionDate).toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-blue-500" />
            {booking.sessionTime} ({booking.duration} mins)
          </div>
        </div>

        {/* Amount & Payment Status */}
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <span className="text-lg font-bold text-gray-900">
              ₹{booking.amount}
            </span>
          </div>
          <span
            className={`text-sm px-3 py-1 rounded-full font-medium flex items-center gap-1 ${
              booking.paymentStatus === "paid"
                ? "bg-green-100 text-green-700"
                : booking.paymentStatus === "failed"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {booking.paymentStatus === "paid" ? (
              <CheckCircle className="h-3.5 w-3.5" />
            ) : booking.paymentStatus === "failed" ? (
              <XCircle className="h-3.5 w-3.5" />
            ) : null}
            {booking.paymentStatus.charAt(0).toUpperCase() +
              booking.paymentStatus.slice(1)}
          </span>
        </div>

        {/* Session Status */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Session Status:</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
              booking.status === "completed"
                ? "bg-green-100 text-green-700"
                : booking.status === "cancelled"
                ? "bg-red-100 text-red-700"
                : booking.status === "ongoing"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {booking.status}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t flex gap-3">
          {booking.paymentStatus === "pending" && user?.role === "student" && (
            <button
              onClick={handlePayment}
              disabled={payLoading}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              {payLoading ? "Processing..." : "Pay Now"}
            </button>
          )}

          {booking.paymentStatus === "paid" &&
            (booking.status === "upcoming" || booking.status === "ongoing") && (
              <button
                onClick={() => router.push(`/call/${booking.meetingRoomId}`)}
                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <Video className="h-4 w-4" />
                Join Video Call
              </button>
            )}
        </div>
      </div>
    </div>
  );
}
