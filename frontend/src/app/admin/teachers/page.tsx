"use client";

import { useState } from "react";
import api from "@/lib/api";
import { TeacherProfile } from "@/types";
import AdminDataTable, { Column } from "@/components/AdminDataTable";
import toast from "react-hot-toast";
import { Trash2, Star } from "lucide-react";

const columns: Column<TeacherProfile>[] = [
  {
    key: "userId",
    label: "Teacher",
    render: (t) =>
      typeof t.userId === "object" ? t.userId.name : String(t.userId),
  },
  {
    key: "email",
    label: "Email",
    className: "hidden sm:table-cell",
    render: (t) =>
      typeof t.userId === "object" ? t.userId.email : "—",
  },
  {
    key: "subjects",
    label: "Subjects",
    render: (t) => (
      <div className="flex flex-wrap gap-1">
        {t.subjects.slice(0, 3).map((s) => (
          <span
            key={s}
            className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs"
          >
            {s}
          </span>
        ))}
        {t.subjects.length > 3 && (
          <span className="text-xs text-gray-400">
            +{t.subjects.length - 3}
          </span>
        )}
      </div>
    ),
  },
  {
    key: "price",
    label: "Price",
    render: (t) => `₹${t.price}/hr`,
  },
  {
    key: "rating",
    label: "Rating",
    className: "hidden md:table-cell",
    render: (t) => (
      <span className="flex items-center gap-1 text-sm">
        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
        {t.rating.toFixed(1)}
        <span className="text-gray-400 text-xs">({t.totalReviews})</span>
      </span>
    ),
  },
];

export default function AdminTeachersPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDelete = async (teacher: TeacherProfile) => {
    const name =
      typeof teacher.userId === "object"
        ? teacher.userId.name
        : "this teacher profile";
    if (!confirm(`Delete profile for "${name}"?`)) return;
    try {
      await api.delete(`/admin/teachers/${teacher._id}`);
      toast.success("Teacher profile deleted");
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <AdminDataTable<TeacherProfile>
      title="Teachers"
      endpoint="/admin/teachers"
      dataKey="teachers"
      columns={columns}
      refreshKey={refreshKey}
      rowActions={(t) => (
        <button
          onClick={() => handleDelete(t)}
          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    />
  );
}
