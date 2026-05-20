"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeStore();

  // Hydrate theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (stored) setTheme(stored);
  }, [setTheme]);

  // Apply the correct class to <html>
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (resolved: "light" | "dark") => {
      root.classList.toggle("dark", resolved === "dark");
    };

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mq.matches ? "dark" : "light");

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }

    applyTheme(theme);
  }, [theme]);

  return <>{children}</>;
}
