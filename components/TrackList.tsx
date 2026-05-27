"use client";
import Image from "next/image";

export interface Track {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
}

interface Props {
  tracks: Track[];
  currentUri: string | null;
  isPlaying: boolean;
  onPlay: (track: Track, index: number) => void;
  loading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

function fmtMs(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function TrackList({
  tracks,
  currentUri,
  isPlaying,
  onPlay,
  loading,
  onLoadMore,
  hasMore,
}: Props) {
  if (loading && tracks.length === 0) {
    return (
      <div className="pixel-card" style={{ textAlign: "center", padding: 32 }}>
        <p style={{ fontSize: 8, color: "var(--text2)" }}>
          Loading<span className="loading-dots" />
        </p>
      </div>
    );
  }

  return (
    <div className="pixel-card" style={{ padding: 0, overflow: "hidden" }}>
      <ul
        className="pixel-list"
        style={{ maxHeight: 520, overflowY: "auto", padding: 8, gap: 2 }}
      >
        {tracks.map((track, i) => {
          const active = track.uri === currentUri;
          return (
            <li
              key={`${track.id}-${i}`}
              className={`pixel-list-item ${active ? "active" : ""}`}
              onClick={() => onPlay(track, i)}
              style={{ gap: 8 }}
            >
              <span style={{ fontSize: 7, color: "var(--text2)", minWidth: 20, textAlign: "right" }}>
                {active && isPlaying ? "▶" : i + 1}
              </span>

              {track.album.images[0] ? (
                <Image
                  src={track.album.images[0].url}
                  alt={track.album.name}
                  width={36}
                  height={36}
                  className="album-art"
                  style={{ width: 36, height: 36, objectFit: "cover", flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: "var(--accent)",
                    border: "2px solid var(--text)",
                    flexShrink: 0,
                  }}
                />
              )}

              <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 7,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: active ? "var(--text)" : undefined,
                  }}
                >
                  {track.name}
                </p>
                <p
                  style={{
                    fontSize: 6,
                    color: "var(--text2)",
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {track.artists.map((a) => a.name).join(", ")}
                </p>
              </div>

              <span style={{ fontSize: 6, color: "var(--text2)", flexShrink: 0 }}>
                {fmtMs(track.duration_ms)}
              </span>
            </li>
          );
        })}

        {hasMore && (
          <li style={{ padding: 8, textAlign: "center" }}>
            <button
              className="pixel-btn"
              style={{ fontSize: 7, padding: "6px 12px" }}
              onClick={onLoadMore}
              disabled={loading}
            >
              {loading ? "Loading..." : "Load more"}
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
