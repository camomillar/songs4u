import { NextRequest, NextResponse } from "next/server";

const SCOPES = [
  "user-read-private",
  "user-read-email",
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
].join(" ");

export function GET(req: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;
  const nonce = Math.random().toString(36).substring(2, 15);

  // Encode optional redirect destination into state
  const returnTo = new URL(req.url).searchParams.get("redirect") ?? "/";
  const state = `${nonce}|${encodeURIComponent(returnTo)}`;

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
  response.cookies.set("spotify_auth_state", nonce, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
  });

  return response;
}
