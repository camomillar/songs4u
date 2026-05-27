"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
// useEffect and useRef used in ClosedCase
import Image from "next/image";
import HeartParticles, { darkenHex } from "@/components/HeartParticles";
import { decodePlaylist } from "@/lib/encode";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";

/* ── Closed case ─────────────────────────────────────────────── */
function ClosedCase({ onOpen, coverImage, bgColor }: { onOpen: () => void; coverImage?: string; bgColor?: string }) {
  const imgRef = useRef<HTMLDivElement>(null);
  const rot = useRef({ x: -8, y: 20 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const idleAngle = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Animate: idle sway when not dragging, live update when dragging
    const tick = () => {
      if (!isDragging.current) {
        idleAngle.current += 0.4;
        rot.current.y = Math.sin((idleAngle.current * Math.PI) / 180) * 22;
      }
      if (imgRef.current) {
        imgRef.current.style.transform = `perspective(900px) rotateX(${rot.current.x}deg) rotateY(${rot.current.y}deg)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // Global mouse/touch handlers so drag works outside the element
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      rot.current.y += dx * 0.9;
      rot.current.x = Math.max(-50, Math.min(50, rot.current.x - dy * 0.9));
    };
    const onUp = () => { isDragging.current = false; };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const dx = e.touches[0].clientX - lastPos.current.x;
      const dy = e.touches[0].clientY - lastPos.current.y;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      rot.current.y += dx * 0.9;
      rot.current.x = Math.max(-50, Math.min(50, rot.current.x - dy * 0.9));
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onUp);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  const startDrag = (clientX: number, clientY: number) => {
    isDragging.current = true;
    lastPos.current = { x: clientX, y: clientY };
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: bgColor || "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
    }}>
      <HeartParticles color={bgColor ? darkenHex(bgColor) : undefined} />
      {/* 3D draggable case */}
      <div
        ref={imgRef}
        onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX, e.clientY); }}
        onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
        style={{
          cursor: "grab",
          willChange: "transform",
          userSelect: "none",
          position: "relative",
          display: "inline-block",
        }}
      >
        <Image
          src="/case-closed.png"
          alt="CD Case"
          width={340}
          height={309}
          style={{ objectFit: "contain", display: "block", pointerEvents: "none" }}
          priority
          draggable={false}
        />

        {/* User's cover photo — overlaid on the front cover area */}
        {coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage}
            alt="Cover"
            style={{
              position: "absolute",
              top: "4%",
              left: "13%",
              width: "79%",
              height: "90%",
              objectFit: "cover",
              pointerEvents: "none",
              display: "block",
            }}
          />
        )}
      </div>

      {/* Open button — separate from the case */}
      <p
        onClick={onOpen}
        style={{
          fontFamily: "'Lora', serif",
          fontStyle: "italic",
          fontSize: 15,
          color: "#aaa",
          cursor: "pointer",
          letterSpacing: 0.3,
          borderBottom: "1px solid #ddd",
          paddingBottom: 2,
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#e03050")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#aaa")}
      >
        click here to open ♥
      </p>
    </div>
  );
}

/* ── Open case ───────────────────────────────────────────────── */
function OpenCase({
  to, from, message, songs, coverImage, bgColor, onBack,
}: {
  to: string; from: string; message: string;
  songs: { id: string; title: string; artist: string; albumArt?: string }[];
  coverImage?: string;
  bgColor?: string;
  onBack: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string | null>>({});
  const [loadingPreviews, setLoadingPreviews] = useState(true);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const total = songs.length;
  const song = songs[currentIndex];

  const trackUris = songs.map(s => `spotify:track:${s.id}`);
  const { isPremium, ready: sdkReady, isPlaying: sdkPlaying, currentTrack, play: sdkPlay, togglePlay: sdkToggle, next: sdkNext } = useSpotifyPlayer(trackUris);

  const isPlaying = isPremium ? sdkPlaying : previewPlaying;

  // Fetch preview URLs (fallback for non-premium)
  useEffect(() => {
    const ids = songs.map(s => s.id).join(",");
    fetch(`/api/preview-urls?ids=${ids}`)
      .then(r => r.json())
      .then(data => setPreviewUrls(data))
      .catch(() => {})
      .finally(() => setLoadingPreviews(false));
  }, []);

  // Reset audio on song change (preview fallback)
  useEffect(() => {
    setPreviewPlaying(false);
    setProgress(0);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
  }, [currentIndex]);

  const togglePlay = () => {
    if (isPremium && sdkReady) {
      if (!sdkPlaying) sdkPlay(currentIndex);
      else sdkToggle();
    } else {
      const audio = audioRef.current;
      const url = previewUrls[song.id];
      if (!audio || !url) return;
      if (previewPlaying) { audio.pause(); setPreviewPlaying(false); }
      else { audio.play(); setPreviewPlaying(true); }
    }
  };

  const next = () => {
    const ni = (currentIndex + 1) % total;
    setCurrentIndex(ni);
    if (isPremium && sdkReady && sdkPlaying) sdkNext();
  };

  const displayTrack = isPremium && currentTrack
    ? { title: currentTrack.name, artist: currentTrack.artists.map((a: {name: string}) => a.name).join(", "), albumArt: currentTrack.album.images[0]?.url }
    : { title: song.title, artist: song.artist, albumArt: song.albumArt };

  const previewUrl = previewUrls[song.id] ?? null;

  return (
    <div style={{
      minHeight: "100vh",
      background: bgColor || "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      animation: "fadeUp 0.5s ease",
      transition: "background 0.4s ease",
    }}>
      <HeartParticles color={bgColor ? darkenHex(bgColor) : undefined} />

      {/* Back button */}
      <button
        onClick={onBack}
        title="Close case"
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "none",
          background: "rgba(0,0,0,0.08)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          color: "#555",
          transition: "background 0.2s",
          zIndex: 10,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.15)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.08)")}
      >
        ←
      </button>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Open jewel case — image with overlaid letter + CD */}
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: 700,
      }}>
<Image
          src="/case-opened.png"
          alt="Open CD Case"
          width={464}
          height={222}
          style={{ width: "100%", height: "auto", display: "block" }}
          priority
        />

        {/* Letter overlay — positioned over the white left panel */}
        <div style={{
          position: "absolute",
          left: "4%",
          top: "7%",
          width: "34%",
          height: "84%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "4% 5%",
          overflow: "hidden",
          fontFamily: "'Breathing', cursive",
        }}>
          {/* My dearest [name], */}
          <p style={{ fontSize: "clamp(11px, 1.7vw, 14px)", color: "#1d3d8e", lineHeight: 1.4, marginBottom: "8%" }}>
            My dearest {to},
          </p>

          {/* Message */}
          {message && (
            <p style={{ fontSize: "clamp(11px, 1.7vw, 14px)", color: "#1d3d8e", lineHeight: 1.4, marginBottom: "8%" }}>
              {message}
            </p>
          )}

          {/* Forever yours, */}
          {from && (
            <>
              <p style={{ fontSize: "clamp(11px, 1.7vw, 14px)", color: "#1d3d8e", lineHeight: 1.4, marginBottom: "6%" }}>
                Forever yours,
              </p>
              {/* Name */}
              <p style={{ fontSize: "clamp(11px, 1.7vw, 14px)", color: "#1d3d8e", lineHeight: 1.4 }}>
                {from}
              </p>
            </>
          )}
        </div>

      </div>


      {/* Player */}
      <div style={{ width: "100%", maxWidth: 700, marginTop: 16 }}>

        {/* Hidden HTML5 audio for non-premium fallback */}
        {previewUrl && (
          <audio ref={audioRef} src={previewUrl}
            onTimeUpdate={() => setProgress(audioRef.current?.currentTime ?? 0)}
            onEnded={() => { setPreviewPlaying(false); next(); }} />
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Album art */}
          {displayTrack.albumArt ? (
            <Image src={displayTrack.albumArt} alt={displayTrack.title} width={52} height={52} unoptimized
              style={{ borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: 8, background: "#eee", flexShrink: 0 }} />
          )}

          {/* Title + artist + progress */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111", fontFamily: "system-ui", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayTrack.title}
            </p>
            {displayTrack.artist && (
              <p style={{ fontSize: 11, color: "#888", fontFamily: "system-ui", marginTop: 2 }}>{displayTrack.artist}</p>
            )}
            {/* Progress bar (preview only) */}
            {!isPremium && (
              <div style={{ marginTop: 6, height: 3, background: "#eee", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, (progress / 30) * 100)}%`, background: "#333", borderRadius: 2, transition: "width 0.5s linear" }} />
              </div>
            )}
          </div>

          {/* Play/pause */}
          <button onClick={togglePlay}
            disabled={isPremium ? !sdkReady : (loadingPreviews || !previewUrl)}
            style={{ width: 38, height: 38, borderRadius: "50%", border: "1.5px solid #ccc", background: "white", cursor: "pointer", fontSize: 14, color: "#333", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {loadingPreviews && !isPremium ? "…" : isPlaying ? "⏸" : "▶"}
          </button>

          {/* Next */}
          {total > 1 && (
            <button onClick={next} style={{ width: 38, height: 38, borderRadius: "50%", border: "1.5px solid #ccc", background: "white", cursor: "pointer", fontSize: 13, color: "#333", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>⏭</button>
          )}
        </div>

        {/* Status label */}
        <p style={{ fontSize: 10, color: "#bbb", fontFamily: "system-ui", marginTop: 8, textAlign: "right" }}>
          {isPremium === true ? "🎵 Full songs via Spotify" : isPremium === false ? "🎵 30s preview" : ""}
        </p>
      </div>

      {/* Footer */}
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "#bbb", marginTop: 32 }}>
        made with ♥ · <a href="/" style={{ color: "#bbb", textDecoration: "none" }}>make your own</a>
      </p>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
function ShareContent() {
  const params = useSearchParams();
  const encoded = params.get("d");
  const playlist = encoded ? decodePlaylist(encoded) : null;
  const [isOpen, setIsOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    fetch("/api/spotify/me")
      .then(r => { setIsAuthed(r.ok); setAuthChecked(true); })
      .catch(() => setAuthChecked(true));
  }, []);

  if (!playlist) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "system-ui", fontSize: 14, color: "#999" }}>Link not found.</p>
      </div>
    );
  }

  // Loading auth check
  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", background: playlist.bgColor || "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "system-ui", fontSize: 14, color: "#999" }}>Loading...</p>
      </div>
    );
  }

  // Login screen
  if (!isAuthed) {
    const loginUrl = `/api/auth/login?context=player&redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "/share")}`;
    return (
      <div style={{
        minHeight: "100vh",
        background: playlist.bgColor || "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 24,
        fontFamily: "system-ui, sans-serif",
      }}>
        <HeartParticles color={playlist.bgColor ? darkenHex(playlist.bgColor) : undefined} />

        {/* Blurred closed case preview */}
        <div style={{ position: "relative" }}>
          <Image src="/case-closed.png" alt="CD" width={220} height={220}
            style={{ objectFit: "contain", filter: "blur(2px)", opacity: 0.7 }} />
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 36,
          }}>🔒</div>
        </div>

        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 26, color: "#3a2010", marginBottom: 8 }}>
            Someone made you a playlist ♥
          </p>
          <p style={{ fontSize: 14, color: "#888", marginBottom: 24, lineHeight: 1.6 }}>
            Log in with Spotify to open it and listen to the full songs
          </p>
          <button
            onClick={() => { window.location.href = loginUrl; }}
            style={{
              background: "#1DB954", color: "white", border: "none",
              borderRadius: 50, padding: "14px 32px", fontSize: 15,
              fontWeight: 600, cursor: "pointer", fontFamily: "system-ui",
              display: "flex", alignItems: "center", gap: 10, margin: "0 auto",
            }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Login with Spotify
          </button>
        </div>
      </div>
    );
  }

  if (!isOpen) return <ClosedCase onOpen={() => setIsOpen(true)} coverImage={playlist.coverImage} bgColor={playlist.bgColor} />;

  return (
    <OpenCase
      to={playlist.to}
      from={playlist.from}
      message={playlist.message}
      songs={playlist.songs}
      coverImage={playlist.coverImage}
      bgColor={playlist.bgColor}
      onBack={() => setIsOpen(false)}
    />
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "system-ui", fontSize: 14, color: "#999" }}>Loading...</p>
      </div>
    }>
      <ShareContent />
    </Suspense>
  );
}
