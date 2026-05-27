import { NextRequest, NextResponse } from "next/server";

// Minimal scopes for the builder — just read playlists
const BUILDER_SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
].join(" ");

// Full scopes for the share page — playback via Web Playback SDK
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

  const state = `${nonce}|${encodeURIComponent(returnTo)}`;

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
  response.cookies.set("spotify_auth_state", nonce, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
  });

  return response;
}
