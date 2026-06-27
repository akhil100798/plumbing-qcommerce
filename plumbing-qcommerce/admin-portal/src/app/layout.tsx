import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlumbCommerce | Super Admin Portal",
  description: "Super Admin portal for PlumbCommerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
