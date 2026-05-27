import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth";
import { spotifyFetch } from "@/lib/spotify";

export async function GET(req: NextRequest) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const offset = url.searchParams.get("offset") ?? "0";

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const data = await spotifyFetch(
    `/playlists/${id}/tracks?limit=50&offset=${offset}&fields=total,items(track(id,name,uri,duration_ms,artists(name),album(name,images)))`,
    token
  );
  return NextResponse.json(data);
}
