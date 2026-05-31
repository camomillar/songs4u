import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth";
import { spotifyFetch } from "@/lib/spotify";
import { redis } from "@/lib/redis";
import { ValentinesPlaylist } from "@/lib/encode";

function errorPage(message: string) {
  return new NextResponse(
    `<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#fff">
      <div style="text-align:center">
        <p style="font-size:16px;color:#333">❌ ${message}</p>
        <a href="javascript:history.back()" style="font-size:13px;color:#888">Go back</a>
      </div>
    </body></html>`,
    { status: 500, headers: { "Content-Type": "text/html" } }
  );
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const base = process.env.SPOTIFY_REDIRECT_URI!.replace("/api/auth/callback", "");
  const id = url.searchParams.get("id");

  if (!id) return NextResponse.redirect(`${base}/`);

  // Not logged in — send to OAuth then come back
  const accessToken = await getAccessToken();
  if (!accessToken) {
    const redirect = encodeURIComponent(`/api/spotify/create-playlist?id=${id}`);
    return NextResponse.redirect(
      `${base}/api/auth/login?context=playlist&redirect=${redirect}`
    );
  }

  // Fetch the songs4u playlist from Redis
  const data = await redis.get<ValentinesPlaylist>(`pl:${id}`);
  if (!data) return errorPage("Playlist not found.");

  try {
    // Get user ID
    const me = await spotifyFetch("/me", accessToken);
    const userId = me.id;
    console.log("👤 Spotify user ID:", userId);
    console.log("🔑 Token (first 20):", accessToken.slice(0, 20));

    // Search Spotify for each song
    const uris: string[] = [];
    for (const song of data.songs) {
      const q = encodeURIComponent(`track:${song.title} artist:${song.artist}`);
      try {
        const result = await spotifyFetch(`/search?q=${q}&type=track&limit=1`, accessToken);
        const track = result?.tracks?.items?.[0];
        if (track) uris.push(track.uri);
      } catch {
        // Skip songs that can't be found
      }
    }

    console.log("🎵 Found URIs:", uris.length);

    // Create the playlist
    const created = await spotifyFetch(`/users/${userId}/playlists`, accessToken, {
      method: "POST",
      body: JSON.stringify({
        name: `songs4u: for ${data.to}`,
        description: data.message ? `${data.message} — made with songs4u` : `A playlist for ${data.to}, made with songs4u`,
        public: true,
      }),
    });

    // Add tracks
    if (uris.length > 0) {
      await spotifyFetch(`/playlists/${created.id}/tracks`, accessToken, {
        method: "POST",
        body: JSON.stringify({ uris: uris.slice(0, 100) }),
      });
    }

    const spotifyUrl = created.external_urls?.spotify;
    console.log("✅ Playlist created:", spotifyUrl);
    return NextResponse.redirect(spotifyUrl);

  } catch (err) {
    console.error("❌ Failed to create Spotify playlist:", err);
    return errorPage("Failed to create Spotify playlist. Please try again.");
  }
}
