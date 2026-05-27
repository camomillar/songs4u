import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const playlistId = new URL(req.url).searchParams.get("id");
  if (!playlistId) return NextResponse.json({ error: "Missing playlist id" }, { status: 400 });

  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Please log in with Spotify first." }, { status: 401 });

  try {
    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Spotify ${res.status}: ${JSON.stringify(body)}`);
    }

    const data = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const songs = data.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((item: any) => item?.track?.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ({
        id: item.track.id,
        title: item.track.name,
        artist: item.track.artists.map((a: { name: string }) => a.name).join(", "),
        albumArt: item.track.album.images[1]?.url ?? item.track.album.images[0]?.url ?? "",
      }));

    return NextResponse.json({ songs });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
