import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth";

export async function GET() {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const res = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) return NextResponse.json({ error: "Failed to fetch playlists" }, { status: res.status });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await res.json() as { items: any[] };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playlists = data.items.map((p: any) => ({
    id: p.id,
    name: p.name,
    image: p.images?.[0]?.url ?? null,
    total: p.tracks?.total ?? 0,
  }));

  return NextResponse.json({ playlists });
}
