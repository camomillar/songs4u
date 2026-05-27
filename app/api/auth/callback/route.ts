import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state") ?? "";
  const storedNonce = req.cookies.get("spotify_auth_state")?.value;

  // Decode base64url state
  let nonce = "";
  let returnTo = "/";
  try {
    const decoded = JSON.parse(Buffer.from(stateParam, "base64url").toString());
    nonce = decoded.nonce ?? "";
    returnTo = decoded.returnTo ?? "/";
  } catch {
    return NextResponse.redirect(new URL("/?error=auth_failed", process.env.SPOTIFY_REDIRECT_URI!.replace("/api/auth/callback", "")));
  }

  if (!code || !storedNonce || nonce !== storedNonce) {
    return NextResponse.redirect(new URL("/?error=auth_failed", process.env.SPOTIFY_REDIRECT_URI!.replace("/api/auth/callback", "")));
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
    return NextResponse.redirect(new URL("/?error=token_failed", process.env.SPOTIFY_REDIRECT_URI!.replace("/api/auth/callback", "")));
  }

  const tokens = await tokenRes.json();
  const expiresAt = Date.now() + tokens.expires_in * 1000;

  // Always use 127.0.0.1 as base (Next.js dev resolves req.url to localhost)
  const base = process.env.SPOTIFY_REDIRECT_URI!.replace("/api/auth/callback", "");
  const response = NextResponse.redirect(new URL(returnTo, base));
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };

  response.cookies.set("spotify_access_token", tokens.access_token, { ...cookieOpts, maxAge: tokens.expires_in });
  response.cookies.set("spotify_refresh_token", tokens.refresh_token, { ...cookieOpts, maxAge: 60 * 60 * 24 * 30 });
  response.cookies.set("spotify_expires_at", String(expiresAt), { ...cookieOpts, maxAge: tokens.expires_in });
  response.cookies.delete("spotify_auth_state");

  return response;
}
