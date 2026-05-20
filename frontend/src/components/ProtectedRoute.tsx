"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { DashboardSkeleton } from "@/components/skeletons";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Which roles are allowed. Omit to allow any authenticated user. */
  allowedRoles?: ("student" | "teacher" | "admin")[];
  /** Where to redirect unauthenticated users (default: /login) */
  redirectTo?: string;
}

/**
 * ProtectedRoute — wraps any page that requires authentication.
 *
 * Usage:
 *   <ProtectedRoute>                           // any logged-in user
 *   <ProtectedRoute allowedRoles={["teacher"]}> // teachers only
 *
 * Shows a skeleton while auth state hydrates, then either renders
 * the children or redirects to the login page.
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, user, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    // Wait one tick so Zustand hydrates from localStorage
    const timeout = setTimeout(() => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        router.replace(redirectTo);
        return;
      }

      setIsReady(true);
    }, 0);

    return () => clearTimeout(timeout);
  }, [router, redirectTo]);

  // After ready, check role restrictions
  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [isReady, isAuthenticated, user, allowedRoles, router, redirectTo]);

  // Still loading auth state
  if (!isReady) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardSkeleton />
      </div>
    );
  }

  // Auth loaded but not authenticated (redirect will happen)
  if (!isAuthenticated) return null;

  // Auth loaded but wrong role (redirect will happen)
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
