import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q");
  if (!q) return NextResponse.json({ tracks: [] });

  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=6`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return NextResponse.json({ error: `Spotify ${res.status}`, body }, { status: res.status });
  }

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tracks = data.tracks.items.map((t: any) => ({
    id: t.id,
    title: t.name,
    artist: t.artists.map((a: { name: string }) => a.name).join(", "),
    albumArt: t.album.images[1]?.url ?? t.album.images[0]?.url ?? "",
    previewUrl: t.preview_url ?? null,
  }));

  return NextResponse.json({ tracks });
}
