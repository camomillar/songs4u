import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth";
import { spotifyFetch } from "@/lib/spotify";

export async function GET() {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await spotifyFetch("/me/playlists?limit=50", token);
  return NextResponse.json(data);
}
