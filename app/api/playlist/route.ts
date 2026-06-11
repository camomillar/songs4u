import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { ValentinesPlaylist } from "@/lib/encode";
import { getPostHogClient } from "@/lib/posthog-server";

function shortId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// POST /api/playlist — save playlist, return short id
export async function POST(req: NextRequest) {
  try {
    const playlist: ValentinesPlaylist = await req.json();
    const id = shortId();
    // Store for 1 year
    await redis.set(`pl:${id}`, JSON.stringify(playlist), { ex: 60 * 60 * 24 * 365 });
    try {
      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: playlist.from || "anonymous",
        event: "playlist_saved",
        properties: {
          playlist_id: id,
          songs_count: playlist.songs?.length ?? 0,
          has_message: !!playlist.message,
          has_cover: !!playlist.coverImage,
          bg_color: playlist.bgColor,
        },
      });
    } catch { /* analytics failure should never break playlist creation */ }
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// GET /api/playlist?id=xxx — load playlist
export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const data = await redis.get(`pl:${id}`);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const playlist = typeof data === "string" ? JSON.parse(data) : data;
  return NextResponse.json(playlist);
}
