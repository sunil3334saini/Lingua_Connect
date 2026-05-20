"use client";

import { useState } from "react";
import api from "@/lib/api";
import { User } from "@/types";
import AdminDataTable, { Column } from "@/components/AdminDataTable";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";

const ROLE_BADGE: Record<string, string> = {
  student: "bg-blue-100 text-blue-700",
  teacher: "bg-purple-100 text-purple-700",
  admin: "bg-red-100 text-red-700",
};

const columns: Column<User>[] = [
  { key: "name", label: "Name" },
  {
    key: "email",
    label: "Email",
    className: "hidden sm:table-cell",
  },
  {
    key: "role",
    label: "Role",
    render: (u) => (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
          ROLE_BADGE[u.role] ?? "bg-gray-100 text-gray-700"
        }`}
      >
        {u.role}
      </span>
    ),
  },
  {
    key: "createdAt",
    label: "Joined",
    className: "hidden md:table-cell",
    render: (u) =>
      u.createdAt
        ? new Date(u.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "—",
  },
];

export default function AdminUsersPage() {
  const [filterRole, setFilterRole] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      toast.success("User deleted");
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error("Failed to delete user");
    }
  };

  return (
    <AdminDataTable<User>
      title="Users"
      endpoint="/admin/users"
      dataKey="users"
      columns={columns}
      queryParams={filterRole ? { role: filterRole } : {}}
      refreshKey={refreshKey}
      filters={
        <div className="flex flex-wrap gap-2">
          {["", "student", "teacher", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                filterRole === r
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {r || "All"}
            </button>
          ))}
        </div>
      }
      rowActions={(user) => (
        <button
          onClick={() => handleDelete(user)}
          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
          title="Delete user"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    />
  );
}
