import { createPrivateMetadata } from "@/lib/seo";

export const metadata = createPrivateMetadata("Booking Details");

export default function BookingDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
