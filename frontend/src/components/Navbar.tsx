"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  LogOut,
  User,
  BookOpen,
  Search,
  LayoutDashboard,
  Menu,
  X,
  Shield,
  MessageSquare,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";

/* ------------------------------------------------------------------ */
/*  NavLink — reusable link that highlights the active route           */
/* ------------------------------------------------------------------ */
function NavLink({
  href,
  children,
  onClick,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
        isActive
          ? "text-blue-600 dark:text-blue-400"
          : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
      } ${className}`}
    >
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Navbar                                                              */
/* ------------------------------------------------------------------ */
export default function Navbar() {
  const { user, isAuthenticated, logout, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Poll unread message count every 30s while authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchUnread = () => {
      import("@/lib/api").then(({ default: api }) =>
        api.get("/messages/unread-count")
          .then((r) => setUnreadMessages(r.data.count ?? 0))
          .catch(() => {})
      );
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 30_000);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  // Close mobile menu on route change
  const pathname = usePathname();
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    if (mobileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setMobileOpen(false);
    router.push("/login");
  }, [logout, router]);

  const closeMobile = () => setMobileOpen(false);

  /* ── Shared link groups (rendered in both desktop & mobile) ────── */
  const publicLinks = user?.role === "teacher" ? null : (
    <NavLink href="/teachers" onClick={closeMobile}>
      <Search className="h-4 w-4" />
      Find Teachers
    </NavLink>
  );

  const authLinks = (
    <>
      <NavLink href="/dashboard" onClick={closeMobile}>
        <LayoutDashboard className="h-4 w-4" />
        Dashboard
      </NavLink>
      <NavLink href="/bookings" onClick={closeMobile}>
        <BookOpen className="h-4 w-4" />
        My Bookings
      </NavLink>
      <NavLink href="/messages" onClick={closeMobile}>
        <span className="relative">
          <MessageSquare className="h-4 w-4" />
          {unreadMessages > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
              {unreadMessages > 9 ? "9+" : unreadMessages}
            </span>
          )}
        </span>
        Messages
      </NavLink>
      {user?.role === "admin" && (
        <NavLink href="/admin" onClick={closeMobile}>
          <Shield className="h-4 w-4" />
          Admin
        </NavLink>
      )}
    </>
  );

  const userBadge = (
    <div className="flex items-center gap-3">
      <NavLink href="/profile" onClick={closeMobile} className="flex items-center gap-2">
        {user?.profileImage ? (
          <img src={user.profileImage} alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <User className="h-4 w-4" />
        )}
        {user?.name}
      </NavLink>
      <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full capitalize select-none">
        {user?.role}
      </span>
      <button
        onClick={handleLogout}
        className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1 transition-colors"
        title="Logout"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );

  const guestLinks = (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        onClick={closeMobile}
        className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        Login
      </Link>
      <Link
        href="/register"
        onClick={closeMobile}
        className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Register
      </Link>
    </div>
  );

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50" ref={menuRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* ── Logo ──────────────────────────────────────────── */}
          <Link href="/" className="flex items-center gap-2" onClick={closeMobile}>
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Lingua<span className="text-blue-600 dark:text-blue-400">Connect</span>
            </span>
          </Link>

          {/* ── Desktop links (md+) ───────────────────────────── */}
          <div className="hidden md:flex items-center gap-6">
            {publicLinks}
            {isAuthenticated ? (
              <>
                {authLinks}
                <div className="ml-4 pl-4 border-l border-gray-200 dark:border-gray-600 flex items-center gap-2">
                  <ThemeToggle />
                  <NotificationBell />
                  {userBadge}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <ThemeToggle />
                {guestLinks}
              </div>
            )}
          </div>

          {/* ── Hamburger button (mobile) ─────────────────────── */}
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown ───────────────────────────────────── */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 pt-2 space-y-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
          {publicLinks}
          {isAuthenticated ? (
            <>
              {authLinks}
              <hr className="border-gray-100 dark:border-gray-700" />
              <div className="flex items-center justify-between">
                {userBadge}
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <NotificationBell />
                </div>
              </div>
            </>
          ) : (
            <>
              <hr className="border-gray-100 dark:border-gray-700" />
              <div className="flex items-center justify-between">
                {guestLinks}
                <ThemeToggle />
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
