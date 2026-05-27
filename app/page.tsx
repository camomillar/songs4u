"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import StarField from "@/components/StarField";
import PlayerBar from "@/components/PlayerBar";
import { usePlayer } from "@/hooks/usePlayer";

interface Track {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
}

interface UserProfile {
  display_name: string;
  product: string;
}

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);

  const { currentTrack, isPlaying, progressMs, play, togglePlay, next, previous, seek, deviceId } =
    usePlayer();

  useEffect(() => {
    fetch("/api/spotify/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setUser(d); setAuthChecked(true); })
      .catch(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!user) return;
    setTracksLoading(true);
    fetch("/api/spotify/top-tracks")
      .then((r) => r.json())
      .then((d) => setTracks(d.items ?? []))
      .finally(() => setTracksLoading(false));
  }, [user]);

  const handlePlayTrack = async (track: Track) => {
    await play(undefined, [track.uri]);
  };

  if (!authChecked) {
    return (
      <div className="login-screen">
        <StarField />
        <p style={{ fontSize: 10, color: "var(--text2)" }}>
          Loading<span className="loading-dots" />
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-screen">
        <StarField />
        <div className="pixel-card login-card">
          <div style={{ fontSize: 48, marginBottom: 16 }}>♪</div>
          <h1 style={{ fontSize: 18, marginBottom: 24, textShadow: "2px 2px 0 var(--accent)" }}>
            Pixel Player
          </h1>
          <p style={{ fontSize: 8, color: "var(--text2)", marginBottom: 28, lineHeight: 2 }}>
            Your top Spotify tracks in pixel style!
          </p>
          <a href="/api/auth/login">
            <button className="pixel-btn green large" style={{ width: "100%" }}>
              ♪ Login with Spotify
            </button>
          </a>
        </div>

        <div
          className="pixel-card"
          style={{ maxWidth: 360, width: "100%", background: "var(--card2)", fontSize: 7, lineHeight: 2.2, color: "var(--text2)" }}
        >
          <p style={{ marginBottom: 6, color: "var(--text)", fontSize: 8 }}>Setup needed:</p>
          <ol style={{ paddingLeft: 16 }}>
            <li>Create app at developer.spotify.com</li>
            <li>
              Set redirect URI:<br />
              <code style={{ fontSize: 6, background: "var(--bg2)", padding: "2px 4px", display: "inline-block", marginTop: 2 }}>
                http://localhost:3000/api/auth/callback
              </code>
            </li>
            <li>Copy <code style={{ fontSize: 6 }}>.env.local.example</code> → <code style={{ fontSize: 6 }}>.env.local</code></li>
            <li>Fill in Client ID + Secret, then <code style={{ fontSize: 6 }}>npm run dev</code></li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <StarField />

      <header className="app-header">
        <span className="app-title">♪ Pixel Player</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 8, color: "var(--text2)" }}>{user.display_name}</span>
          <a href="/api/auth/logout">
            <button className="pixel-btn" style={{ fontSize: 7, padding: "6px 10px" }}>Logout</button>
          </a>
        </div>
      </header>

      <main style={{ padding: 16, maxWidth: 600, margin: "0 auto", width: "100%" }}>
        <p style={{ fontSize: 8, color: "var(--text2)", marginBottom: 14, letterSpacing: 1 }}>
          YOUR TOP 10
        </p>

        {tracksLoading ? (
          <div className="pixel-card" style={{ textAlign: "center", padding: 40 }}>
            <p style={{ fontSize: 8, color: "var(--text2)" }}>Loading<span className="loading-dots" /></p>
          </div>
        ) : (
          <div className="pixel-card" style={{ padding: 0, overflow: "hidden" }}>
            <ul className="pixel-list" style={{ padding: 8, gap: 2 }}>
              {tracks.map((track, i) => {
                const active = track.uri === currentTrack?.uri;
                const imgUrl = track.album.images[0]?.url;
                return (
                  <li
                    key={track.id}
                    className={`pixel-list-item ${active ? "active" : ""}`}
                    onClick={() => handlePlayTrack(track)}
                    style={{ gap: 10 }}
                  >
                    <span style={{ fontSize: 8, color: "var(--text2)", minWidth: 22, textAlign: "right", flexShrink: 0 }}>
                      {active && isPlaying ? "▶" : i + 1}
                    </span>

                    {imgUrl ? (
                      <Image
                        src={imgUrl}
                        alt={track.album.name}
                        width={44}
                        height={44}
                        className="album-art"
                        style={{ width: 44, height: 44, objectFit: "cover", flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{ width: 44, height: 44, background: "var(--accent)", border: "2px solid var(--text)", flexShrink: 0 }} />
                    )}

                    <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
                      <p style={{ fontSize: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {track.name}
                      </p>
                      <p style={{ fontSize: 7, color: "var(--text2)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {track.artists.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </main>

      <PlayerBar
        track={currentTrack ? {
          name: currentTrack.name,
          artists: currentTrack.artists,
          album: currentTrack.album,
          duration_ms: currentTrack.duration_ms,
        } : null}
        isPlaying={isPlaying}
        progressMs={progressMs}
        onPlayPause={togglePlay}
        onNext={next}
        onPrevious={previous}
        onSeek={seek}
        disabled={!deviceId && !isPlaying}
      />
    </div>
  );
}
