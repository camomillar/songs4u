"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type W = any;

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  loadVideoById(videoId: string): void;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}

export interface Props {
  videoId: string;
  title: string;
  artist: string;
  onClose: () => void;
  onPlayStateChange?: (playing: boolean) => void;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function ensureYTScript() {
  if (document.getElementById("yt-iframe-api")) return;
  const s = document.createElement("script");
  s.id = "yt-iframe-api";
  s.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(s);
}

export interface PixelAudioPlayerHandle {
  toggle: () => void;
}

const PixelAudioPlayer = forwardRef<PixelAudioPlayerHandle, Props>(function PixelAudioPlayer(
  { videoId, title, artist, onClose, onPlayStateChange }: Props,
  ref
) {
  const playerRef = useRef<YTPlayer | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const readyRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const isPlayingRef = useRef(false); // always up-to-date, no stale closure

  useImperativeHandle(ref, () => ({
    toggle: () => {
      if (!playerRef.current) return;
      if (isPlayingRef.current) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    },
  }));

  // Create the player ONCE on mount
  useEffect(() => {
    const wrapper = document.createElement("div");
    wrapper.style.cssText =
      "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;bottom:0;left:0;overflow:hidden;";
    const playerDiv = document.createElement("div");
    wrapper.appendChild(playerDiv);
    document.body.appendChild(wrapper);
    wrapperRef.current = wrapper;

    const createPlayer = () => {
      playerRef.current = new (window as W).YT.Player(playerDiv, {
        videoId,
        playerVars: { autoplay: 0, playsinline: 1 },
        events: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onReady: (e: any) => {
            readyRef.current = true;
            setDuration(e.target.getDuration());
            setLoading(false);
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onStateChange: (e: any) => {
            const { PLAYING, PAUSED, ENDED } = (window as W).YT.PlayerState;
            if (e.data === PLAYING) {
              isPlayingRef.current = true;
              setIsPlaying(true);
              onPlayStateChange?.(true);
              setDuration(playerRef.current?.getDuration() ?? 0);
              setLoading(false);
            } else if (e.data === PAUSED || e.data === ENDED) {
              isPlayingRef.current = false;
              setIsPlaying(false);
              onPlayStateChange?.(false);
            }
          },
        },
      });
    };

    if ((window as W).YT?.Player) {
      createPlayer();
    } else {
      const prev = (window as W).onYouTubeIframeAPIReady;
      (window as W).onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        createPlayer();
      };
      ensureYTScript();
    }

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      playerRef.current?.destroy();
      playerRef.current = null;
      readyRef.current = false;
      if (wrapperRef.current && document.body.contains(wrapperRef.current)) {
        document.body.removeChild(wrapperRef.current);
      }
    };
  }, []); // ← runs ONCE on mount

  // When videoId changes — load new video into existing player
  useEffect(() => {
    if (!readyRef.current || !playerRef.current) return;
    setLoading(true);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    playerRef.current.loadVideoById(videoId);
  }, [videoId]); // ← no player recreate, just swap video

  // Progress ticker
  useEffect(() => {
    if (isPlaying) {
      tickRef.current = setInterval(() => {
        setCurrentTime(playerRef.current?.getCurrentTime() ?? 0);
      }, 500);
    } else {
      if (tickRef.current) clearInterval(tickRef.current);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
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
        <p style={{ fontSize: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
        {artist && <p style={{ fontSize: 7, color: "var(--text2)", marginTop: 4 }}>{artist}</p>}
      </div>

      {/* Progress bar */}
      <div
        style={{ width: "100%", height: 10, background: "var(--bg2)", border: "3px solid var(--text)", cursor: "pointer", marginBottom: 12, overflow: "hidden" }}
        onClick={handleSeek}
      >
        <div style={{ height: "100%", width: `${Math.min(100, progress)}%`, background: "var(--accent)", transition: "width 0.4s linear" }} />
      </div>

      {/* Time + play */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 7, color: "var(--text2)", minWidth: 32 }}>{fmt(currentTime)}</span>
        <button className="pixel-btn" onClick={togglePlay} disabled={loading} style={{ fontSize: 18, padding: "10px 24px" }}>
          {loading ? "…" : isPlaying ? "⏸" : "▶"}
        </button>
        <span style={{ fontSize: 7, color: "var(--text2)", minWidth: 32, textAlign: "right" }}>{fmt(duration)}</span>
      </div>
    </div>
  );
});

export default PixelAudioPlayer;
