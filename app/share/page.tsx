"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
// useEffect and useRef used in ClosedCase
import Image from "next/image";
import HeartParticles, { darkenHex } from "@/components/HeartParticles";
import { decodePlaylist } from "@/lib/encode";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string | null>>({});
  const [loadingPreviews, setLoadingPreviews] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const total = songs.length;
  const song = songs[currentIndex];
  const previewUrl = previewUrls[song.id] ?? null;

  // Fetch fresh preview URLs on mount
  useEffect(() => {
    const ids = songs.map(s => s.id).join(",");
    fetch(`/api/preview-urls?ids=${ids}`)
      .then(r => r.json())
      .then(data => setPreviewUrls(data))
      .catch(() => {})
      .finally(() => setLoadingPreviews(false));
  }, []);

  // When song changes, reset audio
  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [currentIndex]);

  const togglePlay = () => {
    if (!audioRef.current || !previewUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const next = () => setCurrentIndex(i => (i + 1) % total);

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


      {/* Custom audio player */}
      <div style={{ width: "100%", maxWidth: 700, marginTop: 16 }}>
        {/* Hidden HTML5 audio element */}
        {previewUrl && (
          <audio
            ref={audioRef}
            src={previewUrl}
            onTimeUpdate={() => setProgress(audioRef.current?.currentTime ?? 0)}
            onEnded={() => { setIsPlaying(false); next(); }}
          />
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Album art */}
          {song.albumArt ? (
            <Image src={song.albumArt} alt={song.title} width={52} height={52} unoptimized
              style={{ borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: 8, background: "#eee", flexShrink: 0 }} />
          )}

          {/* Title + artist + progress */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111", fontFamily: "system-ui", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {song.title}
            </p>
            {song.artist && (
              <p style={{ fontSize: 11, color: "#888", fontFamily: "system-ui", marginTop: 2 }}>{song.artist}</p>
            )}
            {/* Progress bar */}
            <div style={{ marginTop: 6, height: 3, background: "#eee", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(progress / 30) * 100}%`, background: "#333", borderRadius: 2, transition: "width 0.5s linear" }} />
            </div>
          </div>

          {/* Play/pause */}
          <button
            onClick={togglePlay}
            disabled={loadingPreviews || !previewUrl}
            title={!previewUrl ? "No preview available" : undefined}
            style={{ width: 38, height: 38, borderRadius: "50%", border: "1.5px solid #ccc", background: "white", cursor: previewUrl ? "pointer" : "not-allowed", fontSize: 14, color: "#333", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {loadingPreviews ? "…" : isPlaying ? "⏸" : "▶"}
          </button>

          {/* Next */}
          {total > 1 && (
            <button onClick={next} style={{ width: 38, height: 38, borderRadius: "50%", border: "1.5px solid #ccc", background: "white", cursor: "pointer", fontSize: 13, color: "#333", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>⏭</button>
          )}
        </div>

        {!previewUrl && !loadingPreviews && (
          <p style={{ fontSize: 11, color: "#bbb", fontFamily: "system-ui", marginTop: 6, textAlign: "center" }}>
            No preview available for this song
          </p>
        )}
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

  if (!playlist) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "system-ui", fontSize: 14, color: "#999" }}>Link not found.</p>
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
