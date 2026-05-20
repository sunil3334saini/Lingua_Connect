"use client";

import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { ThemeProvider } from "@/components/ThemeProvider";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import ClassReminderBanner from "@/components/ClassReminderBanner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ServiceWorkerRegistrar />
      <Navbar />
      <EmailVerificationBanner />
      <ClassReminderBanner />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">{children}</main>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: "10px", fontSize: "14px" },
        }}
      />
    </ThemeProvider>
  );
}
