import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Someone made you a playlist ♥",
  description: "I made something special for you 🎵 Open to discover your playlist",
  openGraph: {
    title: "Someone made you a playlist ♥",
    description: "I made something special for you 🎵 Open to discover your playlist",
    type: "website",
    siteName: "songs4u",
  },
  twitter: {
    card: "summary",
    title: "Someone made you a playlist ♥",
    description: "I made something special for you 🎵 Open to discover your playlist",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
