async function getClientToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in .env.local");
  }

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

  if (!res.ok || !data.access_token) {
    throw new Error(`Token error: ${JSON.stringify(data)}`);
  }

  return data.access_token as string;
}

export async function fetchPlaylistTracks(playlistId: string, userToken?: string) {
  const token = userToken ?? await getClientToken();

  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Spotify ${res.status}: ${JSON.stringify(body)}`);
  }
  return res.json();
}

export async function fetchPreviewUrls(trackIds: string[]): Promise<Record<string, string | null>> {
  const token = await getClientToken();

  const res = await fetch(
    `https://api.spotify.com/v1/tracks?ids=${trackIds.join(",")}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );

  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await res.json() as { tracks: any[] };

  const result: Record<string, string | null> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data.tracks.forEach((track: any) => {
    if (track?.id) result[track.id] = track.preview_url ?? null;
  });
  return result;
}
