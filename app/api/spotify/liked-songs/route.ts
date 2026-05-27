import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth";
import { spotifyFetch } from "@/lib/spotify";

export async function GET(req: NextRequest) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const offset = new URL(req.url).searchParams.get("offset") ?? "0";
  const data = await spotifyFetch(`/me/tracks?limit=50&offset=${offset}`, token);
  return NextResponse.json(data);
}
