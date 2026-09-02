import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "教學管理系統（舊版）",
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
