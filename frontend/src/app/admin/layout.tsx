import { createPrivateMetadata } from "@/lib/seo";
import AdminShell from "@/components/AdminShell";

export const metadata = createPrivateMetadata("Admin Panel");

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
