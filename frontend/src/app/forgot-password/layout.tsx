import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Forgot Password",
  description:
    "Reset your Lingua Connect password. We'll send a secure reset link to your email.",
});

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
