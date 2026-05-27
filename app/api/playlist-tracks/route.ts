import { NextRequest, NextResponse } from "next/server";
import { fetchPlaylistTracks } from "@/lib/spotify-api";
import { getAccessToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const url = new URL(req.url).searchParams.get("url");
  const match = url?.match(/playlist\/([a-zA-Z0-9]+)/);
  if (!match) return NextResponse.json({ error: "Invalid playlist URL" }, { status: 400 });

  const playlistId = match[1];

  try {
    const userToken = await getAccessToken();

    // No user token = not logged in
    if (!userToken) {
      return NextResponse.json({ error: "Please log in with Spotify first." }, { status: 401 });
    }

    const data = await fetchPlaylistTracks(playlistId, userToken);

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
    const msg = e instanceof Error ? e.message : "Failed to fetch playlist";

    // Give a helpful hint for 403
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
