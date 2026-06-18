import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlumbCommerce | Store Manager Portal",
  description: "Admin and Store Manager operational dashboard for PlumbCommerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
