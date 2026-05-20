"use client";

import { useState } from "react";
import api from "@/lib/api";
import { Booking } from "@/types";
import AdminDataTable, { Column } from "@/components/AdminDataTable";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-700",
  ongoing: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const PAY_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
};

const columns: Column<Booking>[] = [
  {
    key: "studentId",
    label: "Student",
    render: (b) =>
      typeof b.studentId === "object" ? b.studentId.name : String(b.studentId),
  },
  {
    key: "teacherId",
    label: "Teacher",
    className: "hidden sm:table-cell",
    render: (b) =>
      typeof b.teacherId === "object" ? b.teacherId.name : String(b.teacherId),
  },
  { key: "subject", label: "Subject" },
  {
    key: "status",
    label: "Status",
    render: (b) => (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
          STATUS_COLORS[b.status] ?? "bg-gray-100 text-gray-700"
        }`}
      >
        {b.status}
      </span>
    ),
  },
  {
    key: "paymentStatus",
    label: "Payment",
    className: "hidden md:table-cell",
    render: (b) => (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
          PAY_COLORS[b.paymentStatus] ?? "bg-gray-100 text-gray-700"
        }`}
      >
        {b.paymentStatus}
      </span>
    ),
  },
  {
    key: "amount",
    label: "Amount",
    render: (b) => `₹${b.amount}`,
  },
  {
    key: "createdAt",
    label: "Date",
    className: "hidden lg:table-cell",
    render: (b) =>
      b.createdAt
        ? new Date(b.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })
        : "—",
  },
];

export default function AdminBookingsPage() {
  const [filterStatus, setFilterStatus] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDelete = async (booking: Booking) => {
    if (!confirm("Delete this booking? Associated reviews will also be removed."))
      return;
    try {
      await api.delete(`/admin/bookings/${booking._id}`);
      toast.success("Booking deleted");
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error("Failed to delete booking");
    }
  };

  return (
    <AdminDataTable<Booking>
      title="Bookings"
      endpoint="/admin/bookings"
      dataKey="bookings"
      columns={columns}
      queryParams={filterStatus ? { status: filterStatus } : {}}
      refreshKey={refreshKey}
      filters={
        <div className="flex flex-wrap gap-2">
          {["", "upcoming", "ongoing", "completed", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                filterStatus === s
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      }
      rowActions={(b) => (
        <button
          onClick={() => handleDelete(b)}
          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    />
  );
}
