import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth";
import { spotifyFetch } from "@/lib/spotify";

export async function GET() {
  try {
    const token = await getAccessToken();
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await spotifyFetch("/me", token);
    return NextResponse.json(data);
  } catch {
    // Return 401 instead of 500 so the client shows the login screen cleanly
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
