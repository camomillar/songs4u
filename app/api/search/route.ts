import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q");
  if (!q) return NextResponse.json({ tracks: [] });

  const res = await fetch(
    `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=6`,
    { cache: "no-store" }
  );

  if (!res.ok) return NextResponse.json({ tracks: [] });

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tracks = (data.data ?? []).map((t: any) => ({
    id: String(t.id),
    title: t.title,
    artist: t.artist.name,
    albumArt: t.album.cover_medium ?? "",
    previewUrl: t.preview ?? null,
  }));

  return NextResponse.json({ tracks });
}
