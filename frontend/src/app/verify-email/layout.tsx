import { createPrivateMetadata } from "@/lib/seo";

export const metadata = createPrivateMetadata("Verify Email");

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
