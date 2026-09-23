import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tra cứu phí căn hộ An Đồng",
  description: "Tra cứu trạng thái đóng phí căn hộ và quản trị dữ liệu thu phí nội bộ.",
  icons: {
    icon: "/images/logo-hoanghuy.jpg",
    apple: "/images/logo-hoanghuy.jpg",
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
