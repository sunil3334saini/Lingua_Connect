"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on mount.
 * Drop this component anywhere inside a client boundary (e.g. Providers).
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("SW registered, scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("SW registration failed:", err);
        });
    }
  }, []);

  return null;
}
