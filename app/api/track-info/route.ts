import { NextRequest, NextResponse } from "next/server";

async function getClientToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const data = await res.json();
  return data.access_token ?? null;
}

export async function GET(req: NextRequest) {
  const trackUrl = new URL(req.url).searchParams.get("url");
  if (!trackUrl) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  // Extract track ID from URL
  const idMatch = trackUrl.match(/track\/([a-zA-Z0-9]+)/);
  const trackId = idMatch?.[1];

  // 1. Get title, artist, thumbnail from Spotify oEmbed (no auth needed)
  let title = "", artist = "", thumbnail = "";
  try {
    const oembed = await fetch(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(trackUrl)}`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (oembed.ok) {
      const d = await oembed.json();
      title = d.title ?? "";
      artist = d.author_name ?? "";
      thumbnail = d.thumbnail_url ?? "";
    }
  } catch { /* silent */ }

  // 2. Try to get preview URL via Spotify API (Client Credentials)
  let previewUrl: string | null = null;
  if (trackId) {
    try {
      const token = await getClientToken();
      if (token) {
        const trackRes = await fetch(
          `https://api.spotify.com/v1/tracks/${trackId}`,
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
        );
        if (trackRes.ok) {
          const trackData = await trackRes.json();
          previewUrl = trackData.preview_url ?? null;
        }
      }
    } catch { /* silent — preview optional */ }
  }

  return NextResponse.json({ title, artist, thumbnail, previewUrl });
}
