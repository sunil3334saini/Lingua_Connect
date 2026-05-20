"use client";

import { useState } from "react";
import { Booking } from "@/types";
import AdminDataTable, { Column } from "@/components/AdminDataTable";

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
  {
    key: "amount",
    label: "Amount",
    render: (b) => (
      <span className="font-medium text-gray-900">₹{b.amount}</span>
    ),
  },
  {
    key: "paymentStatus",
    label: "Status",
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
    key: "razorpayPaymentId",
    label: "Payment ID",
    className: "hidden md:table-cell",
    render: (b) =>
      b.razorpayPaymentId ? (
        <code className="text-xs text-gray-500">{b.razorpayPaymentId}</code>
      ) : (
        <span className="text-gray-300">—</span>
      ),
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
            year: "numeric",
          })
        : "—",
  },
];

export default function AdminPaymentsPage() {
  const [filterPay, setFilterPay] = useState("");

  return (
    <AdminDataTable<Booking>
      title="Payments"
      endpoint="/admin/payments"
      dataKey="payments"
      columns={columns}
      queryParams={filterPay ? { paymentStatus: filterPay } : {}}
      filters={
        <div className="flex flex-wrap gap-2">
          {["", "paid", "pending", "failed", "refunded"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterPay(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                filterPay === s
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      }
    />
  );
}
