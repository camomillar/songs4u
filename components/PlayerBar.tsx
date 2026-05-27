"use client";
import Image from "next/image";
import { useCallback } from "react";

interface Track {
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
  duration_ms: number;
}

interface Props {
  track: Track | null;
  isPlaying: boolean;
  progressMs: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (ms: number) => void;
  disabled: boolean;
}

function fmtMs(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function PlayerBar({
  track,
  isPlaying,
  progressMs,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  disabled,
}: Props) {
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!track) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      onSeek(Math.floor(ratio * track.duration_ms));
    },
    [track, onSeek]
  );

  const progress = track ? (progressMs / track.duration_ms) * 100 : 0;
  const imgUrl = track?.album.images[0]?.url;

  return (
    <div className="player-bar">
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Track info */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 48,
              height: 48,
              flexShrink: 0,
              position: "relative",
            }}
          >
            {imgUrl ? (
              <Image
                src={imgUrl}
                alt="album"
                width={48}
                height={48}
                className={`album-art ${isPlaying ? "spinning" : "spinning paused"}`}
                style={{ width: 48, height: 48, objectFit: "cover", borderRadius: "50%" }}
              />
            ) : (
              <div
                style={{
                  width: 48,
                  height: 48,
                  background: "var(--accent)",
                  border: "4px solid var(--text)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                }}
              >
                ♪
              </div>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            {track ? (
              <>
                <div className="marquee-container" style={{ maxWidth: 200 }}>
                  <p
                    className={`marquee-text ${track.name.length < 20 ? "short" : ""}`}
                    style={{ fontSize: 8 }}
                  >
                    {track.name}&nbsp;&nbsp;&nbsp;&nbsp;{track.name}
                  </p>
                </div>
                <p style={{ fontSize: 7, color: "var(--text2)", marginTop: 2 }}>
                  {track.artists.map((a) => a.name).join(", ")}
                </p>
              </>
            ) : (
              <p style={{ fontSize: 7, color: "var(--text2)" }}>No track selected</p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              className="pixel-btn icon"
              onClick={onPrevious}
              disabled={disabled}
              title="Previous"
            >
              ⏮
            </button>
            <button
              className="pixel-btn icon green"
              onClick={onPlayPause}
              disabled={disabled}
              style={{ minWidth: 52, minHeight: 52, fontSize: 20 }}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button
              className="pixel-btn icon"
              onClick={onNext}
              disabled={disabled}
              title="Next"
            >
              ⏭
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", minWidth: 200 }}>
            <span style={{ fontSize: 6, color: "var(--text2)", minWidth: 28 }}>
              {fmtMs(progressMs)}
            </span>
            <div
              className="pixel-progress"
              style={{ flex: 1 }}
              onClick={handleProgressClick}
            >
              <div
                className="pixel-progress-fill"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <span style={{ fontSize: 6, color: "var(--text2)", minWidth: 28 }}>
              {track ? fmtMs(track.duration_ms) : "0:00"}
            </span>
          </div>
        </div>

        {/* Right spacer */}
        <div />
      </div>
    </div>
  );
}
