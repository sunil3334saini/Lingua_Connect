import type { Metadata } from "next";

const SITE_NAME = "Lingua Connect";
const SITE_DESC =
  "1:1 and 1:many online learning platform. Connect with expert teachers for personalized video/audio sessions.";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

/**
 * Reusable metadata factory.
 * Pass page-specific overrides — everything else inherits sensible defaults.
 *
 * Usage (in any server-component layout or page):
 *   export const metadata = createMetadata({ title: "Teachers", description: "…" });
 */
export function createMetadata(overrides: Metadata = {}): Metadata {
  const title = overrides.title ?? SITE_NAME;
  const description =
    typeof overrides.description === "string" ? overrides.description : SITE_DESC;

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    applicationName: SITE_NAME,
    keywords: [
      "online learning",
      "language teachers",
      "video tutoring",
      "1:1 sessions",
      "Lingua Connect",
    ],
    openGraph: {
      title: typeof title === "string" ? title : SITE_NAME,
      description,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      ...(typeof overrides.openGraph === "object" ? overrides.openGraph : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: typeof title === "string" ? title : SITE_NAME,
      description,
      ...(typeof overrides.twitter === "object" ? overrides.twitter : {}),
    },
    robots: {
      index: true,
      follow: true,
      ...(typeof overrides.robots === "object" ? overrides.robots : {}),
    },
    ...overrides,
    // Keep our computed og / twitter / robots — override spreads above handle merging
  };
}

/** Shorthand for pages behind auth that should not be indexed. */
export function createPrivateMetadata(title: string): Metadata {
  return createMetadata({
    title,
    robots: { index: false, follow: false },
  });
}

export { SITE_NAME, SITE_DESC, BASE_URL };
