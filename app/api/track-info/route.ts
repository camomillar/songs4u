import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const trackUrl = new URL(req.url).searchParams.get("url");
  if (!trackUrl) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    const res = await fetch(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(trackUrl)}`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (!res.ok) throw new Error("oembed failed");
    const data = await res.json();

    // Title comes as "Song Name - Artist Name" or just "Song Name"
    const fullTitle: string = data.title ?? "";
    const parts = fullTitle.split(" - ");
    const title = parts[0]?.trim() ?? fullTitle;
    const artist = parts[1]?.trim() ?? "";

    return NextResponse.json({
      title,
      artist,
      thumbnail: data.thumbnail_url ?? "",
    });
  } catch {
    return NextResponse.json({ error: "Could not fetch track info" }, { status: 500 });
  }
}
