import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "教學管理系統（舊版）",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/legacy-app/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/legacy-app/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/legacy-app/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "排笛教學管理系統",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#7fc8a9",
};

export default function LegacyPage() {
  return (
    <iframe
      src="/legacy-app/index.html"
      title="教學管理系統（舊版）"
      style={{
        display: "block",
        width: "100vw",
        height: "100vh",
        border: "none",
      }}
    />
  );
}
