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

    return NextResponse.json({
      title: data.title ?? "",
      artist: data.author_name ?? "",
      thumbnail: data.thumbnail_url ?? "",
    });
  } catch {
    return NextResponse.json({ error: "Could not fetch track info" }, { status: 500 });
  }
}
