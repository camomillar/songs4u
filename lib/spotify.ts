const SPOTIFY_BASE = "https://api.spotify.com/v1";

export async function spotifyFetch(
  path: string,
  accessToken: string,
  options: RequestInit = {}
) {
  const res = await fetch(`${SPOTIFY_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 204) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Spotify API error ${res.status}`);
  }

  return res.json();
}

export async function refreshAccessToken(refreshToken: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) throw new Error("Failed to refresh token");
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}
