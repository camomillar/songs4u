"use client";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
  }
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}

interface Props {
  videoId: string;
  title: string;
  artist: string;
  onClose: () => void;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

// Load the YT API script once globally
function loadYTScript() {
  if (document.getElementById("yt-iframe-api")) return;
  const s = document.createElement("script");
  s.id = "yt-iframe-api";
  s.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(s);
}

export default function PixelAudioPlayer({ videoId, title, artist, onClose }: Props) {
  const playerRef = useRef<YTPlayer | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let destroyed = false;

    // Hidden container for the iframe
    const wrapper = document.createElement("div");
    wrapper.style.cssText =
      "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;bottom:0;left:0;overflow:hidden;";
    const playerDiv = document.createElement("div");
    wrapper.appendChild(playerDiv);
    document.body.appendChild(wrapper);
    wrapperRef.current = wrapper;

    const initPlayer = () => {
      if (destroyed) return;
      playerRef.current = new window.YT.Player(playerDiv, {
        videoId,
        playerVars: { autoplay: 1, playsinline: 1 },
        events: {
          onReady: (e) => {
            if (destroyed) return;
            e.target.playVideo();
            setDuration(e.target.getDuration());
            setLoading(false);
          },
          onStateChange: (e) => {
            if (destroyed) return;
            const { PLAYING, PAUSED, ENDED } = window.YT.PlayerState;
            if (e.data === PLAYING) {
              setIsPlaying(true);
              setDuration(playerRef.current?.getDuration() ?? 0);
            } else if (e.data === PAUSED || e.data === ENDED) {
              setIsPlaying(false);
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      // API already loaded — init immediately
      initPlayer();
    } else {
      // Queue up init for when the API fires
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        initPlayer();
      };
      loadYTScript();
    }

    return () => {
      destroyed = true;
      if (tickRef.current) clearInterval(tickRef.current);
      playerRef.current?.destroy();
      playerRef.current = null;
      if (wrapperRef.current && document.body.contains(wrapperRef.current)) {
        document.body.removeChild(wrapperRef.current);
      }
    };
  }, [videoId]);

  // Progress ticker
  useEffect(() => {
    if (isPlaying) {
      tickRef.current = setInterval(() => {
        setCurrentTime(playerRef.current?.getCurrentTime() ?? 0);
      }, 500);
    } else {
      if (tickRef.current) clearInterval(tickRef.current);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const secs = ((e.clientX - rect.left) / rect.width) * duration;
    playerRef.current.seekTo(secs, true);
    setCurrentTime(secs);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="pixel-card" style={{ padding: 16 }}>
      {/* Bars + close */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div className={`music-bars ${isPlaying ? "playing" : ""}`}>
          {[6, 14, 10, 18, 8, 14, 10].map((h, i) => (
            <div
              key={i}
              className="music-bar"
              style={{ "--bh": `${h}px`, animationDelay: `${i * 0.1}s` } as React.CSSProperties}
            />
          ))}
        </div>
        <button className="pixel-btn ghost" style={{ fontSize: 10, padding: "4px 8px" }} onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Song info */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </p>
        {artist && <p style={{ fontSize: 7, color: "var(--text2)", marginTop: 4 }}>{artist}</p>}
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: "100%", height: 10,
          background: "var(--bg2)", border: "3px solid var(--text)",
          cursor: "pointer", marginBottom: 12, overflow: "hidden",
        }}
        onClick={handleSeek}
      >
        <div style={{ height: "100%", width: `${Math.min(100, progress)}%`, background: "var(--accent)", transition: "width 0.4s linear" }} />
      </div>

      {/* Time + controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 7, color: "var(--text2)", minWidth: 32 }}>{fmt(currentTime)}</span>
        <button className="pixel-btn" onClick={togglePlay} disabled={loading} style={{ fontSize: 18, padding: "10px 24px" }}>
          {loading ? "…" : isPlaying ? "⏸" : "▶"}
        </button>
        <span style={{ fontSize: 7, color: "var(--text2)", minWidth: 32, textAlign: "right" }}>{fmt(duration)}</span>
      </div>
    </div>
  );
}
