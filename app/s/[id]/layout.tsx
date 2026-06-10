import type { Metadata } from "next";
import { redis } from "@/lib/redis";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  let from = "";
  try {
    const data = await redis.get(`pl:${id}`);
    if (data) {
      const playlist = typeof data === "string" ? JSON.parse(data) : data;
      from = playlist.to ?? "";
    }
  } catch {}

  const title = from
    ? `A playlist from ${from} ♥`
    : "Someone made you a playlist ♥";
  const description = "Open to discover your playlist 🎵";

  return {
    title,
    description,
    openGraph: { title, description, type: "website", siteName: "songs4u" },
    twitter: { card: "summary", title, description },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
