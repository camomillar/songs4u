import { NextRequest, NextResponse } from "next/server";

const BUILDER_SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
].join(" ");

const PLAYER_SCOPES = [
  "user-read-private",
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
].join(" ");

export function GET(req: NextRequest) {
  const url = new URL(req.url);
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;
  const nonce = Math.random().toString(36).substring(2, 15);
  const returnTo = url.searchParams.get("redirect") ?? "/";
  const context = url.searchParams.get("context") ?? "builder";
  const scopes = context === "player" ? PLAYER_SCOPES : BUILDER_SCOPES;

  // Encode returnTo in state — Spotify preserves & returns it, no cookie needed
  // Use base64url (URL-safe) so Spotify doesn't mangle +/= chars
  const state = Buffer.from(JSON.stringify({ nonce, returnTo })).toString("base64url");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    state,
  });

  const response = NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params}`
  );

  // Only store nonce for CSRF verification
  response.cookies.set("spotify_auth_state", nonce, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return response;
}
