import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Browse Teachers",
  description:
    "Find expert teachers for any subject on Lingua Connect. Filter by language, rating, price, and availability.",
});

export default function TeachersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
