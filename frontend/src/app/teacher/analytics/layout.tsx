import { createPrivateMetadata } from "@/lib/seo";

export const metadata = createPrivateMetadata("Teacher Analytics");

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
