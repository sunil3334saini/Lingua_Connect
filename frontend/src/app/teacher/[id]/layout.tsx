import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Teacher Profile",
  description:
    "View teacher details, reviews, availability, and book a session on Lingua Connect.",
});

export default function TeacherDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
