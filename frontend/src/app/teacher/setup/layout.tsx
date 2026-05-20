import { createPrivateMetadata } from "@/lib/seo";

export const metadata = createPrivateMetadata("Teacher Setup");

export default function TeacherSetupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
