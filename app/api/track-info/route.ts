import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const videoUrl = new URL(req.url).searchParams.get("url");
  if (!videoUrl) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`
    );
    if (!res.ok) throw new Error("oembed failed");
    const data = await res.json();

    return NextResponse.json({
      title: data.title ?? "",
      artist: data.author_name ?? "",
    });
  } catch {
    return NextResponse.json({ error: "Could not fetch track info" }, { status: 500 });
  }
}
