import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = req.cookies.get("spotify_auth_state")?.value;
  const returnTo = req.cookies.get("spotify_return_to")?.value ?? "/";

  const base = process.env.SPOTIFY_REDIRECT_URI!.replace("/api/auth/callback", "");

  if (!code || state !== storedState) {
    return NextResponse.redirect(`${base}/`);
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${base}/`);
  }

  const tokens = await tokenRes.json();
  const expiresAt = Date.now() + tokens.expires_in * 1000;

  // If returnTo is already a full URL use it directly, otherwise prepend base
  const destination = returnTo.startsWith("http") ? returnTo : `${base}${returnTo}`;
  const response = NextResponse.redirect(destination);
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };

  response.cookies.set("spotify_access_token", tokens.access_token, { ...cookieOpts, maxAge: tokens.expires_in });
  response.cookies.set("spotify_refresh_token", tokens.refresh_token, { ...cookieOpts, maxAge: 60 * 60 * 24 * 30 });
  response.cookies.set("spotify_expires_at", String(expiresAt), { ...cookieOpts, maxAge: tokens.expires_in });
  response.cookies.delete("spotify_auth_state");
  response.cookies.delete("spotify_return_to");

  return response;
}
