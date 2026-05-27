import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lovelist ♥",
  description: "Make a Valentine's playlist for someone special",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
