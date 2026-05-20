import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Reset Password",
  description: "Choose a new password for your Lingua Connect account.",
});

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
