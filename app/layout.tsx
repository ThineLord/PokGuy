import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { siteOriginFromHeaders } from "../src/features/app/siteOrigin";
import "./globals.css";

const title = "RiverLab · 德州扑克训练台";
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
  themeColor: "#070b12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
