import { createPrivateMetadata } from "@/lib/seo";

export const metadata = createPrivateMetadata("My Profile");

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
