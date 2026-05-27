"use client";
import { useEffect, useState, useCallback } from "react";
import StarField from "@/components/StarField";
import PlaylistSidebar, { type Playlist } from "@/components/PlaylistSidebar";
import TrackList, { type Track } from "@/components/TrackList";
import PlayerBar from "@/components/PlayerBar";
import { usePlayer } from "@/hooks/usePlayer";

interface UserProfile {
  display_name: string;
  images: { url: string }[];
  product: string;
}

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [tracksOffset, setTracksOffset] = useState(0);
  const [tracksTotal, setTracksTotal] = useState(0);

  const { currentTrack, isPlaying, progressMs, play, togglePlay, next, previous, seek, deviceId } =
    usePlayer();

  // Auth check
  useEffect(() => {
    fetch("/api/spotify/me")
      .then((r) => {
        if (r.ok) return r.json();
        return null;
      })
      .then((d) => {
        setUser(d);
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, []);

  // Load playlists
  useEffect(() => {
    if (!user) return;
    setPlaylistsLoading(true);

    fetch("/api/spotify/playlists")
      .then((r) => r.json())
      .then((d) => {
        const liked: Playlist = {
          id: "liked",
          name: "Liked Songs",
          uri: "liked",
          images: [],
          tracks: { total: 0 },
          type: "liked",
        };
        const items: Playlist[] = (d.items ?? []).map((p: Playlist) => ({
          ...p,
          type: "playlist" as const,
        }));
        setPlaylists([liked, ...items]);
      })
      .finally(() => setPlaylistsLoading(false));
  }, [user]);

  const loadTracks = useCallback(
    async (playlist: Playlist, offset = 0) => {
      setTracksLoading(true);
      try {
        const url =
          playlist.type === "liked"
            ? `/api/spotify/liked-songs?offset=${offset}`
            : `/api/spotify/playlist-tracks?id=${playlist.id}&offset=${offset}`;

        const res = await fetch(url);
        const data = await res.json();

        const items: Track[] =
          playlist.type === "liked"
            ? (data.items ?? []).map((i: { track: Track }) => i.track)
            : (data.items ?? []).map((i: { track: Track }) => i.track);

        setTracksTotal(data.total ?? 0);

        if (offset === 0) {
          setTracks(items);
        } else {
          setTracks((prev) => [...prev, ...items]);
        }
        setTracksOffset(offset + items.length);
      } finally {
        setTracksLoading(false);
      }
    },
    []
  );

  const handleSelectPlaylist = useCallback(
    (playlist: Playlist) => {
      setActivePlaylist(playlist);
      setTracks([]);
      setTracksOffset(0);
      loadTracks(playlist, 0);
    },
    [loadTracks]
  );

  const handlePlayTrack = useCallback(
    async (track: Track, index: number) => {
      if (!activePlaylist) return;

      if (activePlaylist.type === "liked") {
        await play(undefined, [track.uri]);
      } else {
        await play(activePlaylist.uri, undefined, { position: index });
      }
    },
    [activePlaylist, play]
  );

  const handleLoadMore = useCallback(() => {
    if (activePlaylist) loadTracks(activePlaylist, tracksOffset);
  }, [activePlaylist, tracksOffset, loadTracks]);

  // Not loaded yet
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

  // Not logged in
  if (!user) {
    return (
      <div className="login-screen">
        <StarField />
        <div className="pixel-card login-card">
          <div style={{ fontSize: 32, marginBottom: 16 }}>♪</div>
          <h1
            className="app-title"
            style={{ marginBottom: 8, fontSize: 16, display: "block" }}
          >
            Pixel
          </h1>
          <h1
            className="app-title"
            style={{ marginBottom: 24, fontSize: 16, display: "block" }}
          >
            Player
          </h1>
          <p
            style={{
              fontSize: 8,
              color: "var(--text2)",
              marginBottom: 28,
              lineHeight: 2,
            }}
          >
            Connect your Spotify and jam to your playlists in pixel style!
          </p>
          <a href="/api/auth/login">
            <button className="pixel-btn green large" style={{ width: "100%" }}>
              ♪ Login with Spotify
            </button>
          </a>
        </div>

        <div
          className="pixel-card"
          style={{
            maxWidth: 360,
            width: "100%",
            background: "var(--card2)",
            fontSize: 7,
            lineHeight: 2.2,
            color: "var(--text2)",
          }}
        >
          <p style={{ marginBottom: 6, color: "var(--text)", fontSize: 8 }}>
            Setup needed:
          </p>
          <ol style={{ paddingLeft: 16 }}>
            <li>Create app at developer.spotify.com</li>
            <li>
              Set redirect URI:
              <br />
              <code
                style={{
                  fontSize: 6,
                  background: "var(--bg2)",
                  padding: "2px 4px",
                  display: "inline-block",
                  marginTop: 2,
                }}
              >
                http://localhost:3000/api/auth/callback
              </code>
            </li>
            <li>
              Copy <code style={{ fontSize: 6 }}>.env.local.example</code> →{" "}
              <code style={{ fontSize: 6 }}>.env.local</code>
            </li>
            <li>Fill in Client ID + Secret</li>
          </ol>
        </div>
      </div>
    );
  }

  // Main app
  return (
    <div className="app-layout">
      <StarField />

      {/* Header */}
      <header className="app-header">
        <span className="app-title">♪ Pixel Player</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 8, color: "var(--text2)" }}>
            {user.display_name}
            {user.product !== "premium" && (
              <span style={{ color: "var(--pink)", marginLeft: 6 }}>[free]</span>
            )}
          </span>
          <a href="/api/auth/logout">
            <button className="pixel-btn" style={{ fontSize: 7, padding: "6px 10px" }}>
              Logout
            </button>
          </a>
        </div>
      </header>

      {/* Body */}
      <main className="main-content">
        <PlaylistSidebar
          playlists={playlists}
          activeId={activePlaylist?.id ?? null}
          onSelect={handleSelectPlaylist}
          loading={playlistsLoading}
        />

        <div>
          {!activePlaylist ? (
            <div
              className="pixel-card"
              style={{ textAlign: "center", padding: 48 }}
            >
              <p style={{ fontSize: 24, marginBottom: 16 }}>♪</p>
              <p style={{ fontSize: 8, color: "var(--text2)" }}>
                Select a playlist to get started
              </p>
              {!deviceId && user.product === "premium" && (
                <p
                  style={{
                    fontSize: 7,
                    color: "var(--pink)",
                    marginTop: 16,
                    lineHeight: 2,
                  }}
                >
                  Connecting player
                  <span className="loading-dots" />
                </p>
              )}
            </div>
          ) : (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 8, color: "var(--text)" }}>
                  {activePlaylist.name}
                </span>
                <span style={{ fontSize: 7, color: "var(--text2)" }}>
                  ({tracksTotal} songs)
                </span>
              </div>
              <TrackList
                tracks={tracks}
                currentUri={currentTrack?.uri ?? null}
                isPlaying={isPlaying}
                onPlay={handlePlayTrack}
                loading={tracksLoading}
                hasMore={tracks.length < tracksTotal}
                onLoadMore={handleLoadMore}
              />
            </div>
          )}
        </div>
      </main>

      {/* Player */}
      <PlayerBar
        track={
          currentTrack
            ? {
                name: currentTrack.name,
                artists: currentTrack.artists,
                album: currentTrack.album,
                duration_ms: currentTrack.duration_ms,
              }
            : null
        }
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
