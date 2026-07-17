import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RiverLab · 德州扑克训练台",
  description: "完全本地运行的单机德州扑克训练、复盘与统计工具。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
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
