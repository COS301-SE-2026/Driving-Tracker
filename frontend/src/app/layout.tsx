import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Driving Tracker",
  description: "Driving Tracker web dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
