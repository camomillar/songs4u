import { NextRequest, NextResponse } from "next/server";
import { fetchPreviewUrls } from "@/lib/spotify-api";

export async function GET(req: NextRequest) {
  const ids = new URL(req.url).searchParams.get("ids");
  if (!ids) return NextResponse.json({ error: "Missing ids" }, { status: 400 });

  try {
    const urls = await fetchPreviewUrls(ids.split(","));
    return NextResponse.json(urls);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch previews";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
