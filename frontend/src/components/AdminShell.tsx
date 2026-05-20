"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="flex h-[calc(100vh-64px)]">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
