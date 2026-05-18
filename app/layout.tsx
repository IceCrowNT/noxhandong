import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tra cứu phí căn hộ An Đồng",
  description: "Tra cứu trạng thái đóng phí căn hộ và quản trị dữ liệu thu phí nội bộ."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
