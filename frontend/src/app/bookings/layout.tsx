import { createPrivateMetadata } from "@/lib/seo";

export const metadata = createPrivateMetadata("My Bookings");

export default function BookingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
