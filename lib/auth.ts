import { cookies } from "next/headers";
import { refreshAccessToken } from "./spotify";

export async function getAccessToken(): Promise<string | null> {
  const jar = await cookies();
  const accessToken = jar.get("spotify_access_token")?.value;
  const refreshToken = jar.get("spotify_refresh_token")?.value;
  const expiresAt = jar.get("spotify_expires_at")?.value;

  if (!refreshToken) return null;

  if (accessToken && expiresAt && Date.now() < Number(expiresAt) - 30_000) {
    return accessToken;
  }

  try {
    const data = await refreshAccessToken(refreshToken);
    const newExpiry = Date.now() + data.expires_in * 1000;

    jar.set("spotify_access_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: data.expires_in,
      path: "/",
    });
    jar.set("spotify_expires_at", String(newExpiry), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: data.expires_in,
      path: "/",
    });

    return data.access_token;
  } catch {
    return null;
  }
}
