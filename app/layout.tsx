import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "songs4u",
  description: "Make a playlist for someone special",
  openGraph: {
    title: "songs4u ♥",
    description: "Make a playlist for someone special",
    siteName: "songs4u",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
