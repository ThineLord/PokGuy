import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { siteOriginFromHeaders } from "../src/features/app/siteOrigin";
import { themeInitScript } from "../src/features/app/themeInit";
import "./globals.css";
import "./pokguy.css";
import "./theme.css";

const title = "PokGuy";
const description = "完全本地运行的单机德州扑克训练、复盘与统计工具。";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const siteOrigin = siteOriginFromHeaders(
    requestHeaders.get("host"),
    requestHeaders.get("x-forwarded-proto"),
    process.env.VINEXT_TRUST_PROXY === "1" ||
      Boolean(process.env.VINEXT_TRUSTED_HOSTS?.trim()),
  );
  const socialImage = new URL("/og.png", siteOrigin).toString();

  return {
    title,
    description,
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      type: "website",
      title,
      description,
      images: [{ url: socialImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3f2ec",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
