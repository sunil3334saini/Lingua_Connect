import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Create Account",
  description:
    "Register as a student or teacher on Lingua Connect. Start learning or teaching today.",
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
