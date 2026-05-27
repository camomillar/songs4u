import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth";
import { spotifyFetch } from "@/lib/spotify";

export async function GET() {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await spotifyFetch("/me/player", token);
  return NextResponse.json(data ?? { is_playing: false });
}

export async function PUT(req: NextRequest) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, deviceId, contextUri, uris, offset } = body;

  try {
    if (action === "play") {
      await spotifyFetch(
        `/me/player/play${deviceId ? `?device_id=${deviceId}` : ""}`,
        token,
        {
          method: "PUT",
          body: JSON.stringify({
            ...(contextUri ? { context_uri: contextUri } : {}),
            ...(uris ? { uris } : {}),
            ...(offset !== undefined ? { offset } : {}),
          }),
        }
      );
    } else if (action === "pause") {
      await spotifyFetch("/me/player/pause", token, { method: "PUT" });
    } else if (action === "next") {
      await spotifyFetch("/me/player/next", token, { method: "POST" });
    } else if (action === "previous") {
      await spotifyFetch("/me/player/previous", token, { method: "POST" });
    } else if (action === "seek") {
      await spotifyFetch(
        `/me/player/seek?position_ms=${body.positionMs}`,
        token,
        { method: "PUT" }
      );
    } else if (action === "transfer") {
      await spotifyFetch("/me/player", token, {
        method: "PUT",
        body: JSON.stringify({ device_ids: [deviceId], play: true }),
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Player error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
