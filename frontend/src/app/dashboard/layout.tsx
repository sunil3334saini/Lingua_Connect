import { createPrivateMetadata } from "@/lib/seo";

export const metadata = createPrivateMetadata("Dashboard");

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
