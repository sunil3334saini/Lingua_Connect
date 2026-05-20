import { createPrivateMetadata } from "@/lib/seo";

export const metadata = createPrivateMetadata("Video Call");

export default function CallLayout({ children }: { children: React.ReactNode }) {
  return children;
}
