import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apartment Fee Reviewer",
  description: "Internal tool for parsing bank statements and exporting reviewed Excel files."
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
