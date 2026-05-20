import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Log In",
  description:
    "Sign in to your Lingua Connect account to access your dashboard, bookings, and lessons.",
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
