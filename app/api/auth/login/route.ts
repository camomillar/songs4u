import { NextResponse } from "next/server";

const SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-library-read",
  "playlist-read-private",
  "playlist-read-collaborative",
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
].join(" ");

export function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;
  const state = Math.random().toString(36).substring(2, 15);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
  });

  const response = NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params}`
  );
  response.cookies.set("spotify_auth_state", state, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
  });

  return response;
}
