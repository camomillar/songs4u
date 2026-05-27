"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import HeartParticles, { darkenHex } from "@/components/HeartParticles";
import { decodePlaylist } from "@/lib/encode";
import { getThumbnail } from "@/lib/youtube";
import { useYouTube } from "@/hooks/useYouTube";

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
  songs: { id: string; title: string; artist: string }[];
  coverImage?: string;
  bgColor?: string;
  onBack: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = songs.length;
  const song = songs[currentIndex];
  const { isPlaying, play, pause } = useYouTube();

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play(song.id);
    }
  };

  const next = () => {
    const ni = (currentIndex + 1) % total;
    setCurrentIndex(ni);
    play(songs[ni].id); // called directly in click — no React effect delay
  };

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
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        marginTop: 20,
        width: "100%",
        maxWidth: 700,
      }}>
        {/* Thumbnail */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getThumbnail(song.id)}
          alt={song.title}
          width={48}
          height={48}
          style={{ borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
        />

        {/* Title + artist */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#111", fontFamily: "system-ui, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {song.title}
          </p>
          <p style={{ fontSize: 11, color: "#888", fontFamily: "system-ui, sans-serif", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {song.artist}
          </p>
        </div>

        {/* Play/pause */}
        <button
          onClick={handlePlayPause}
          style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid #ccc", background: "white", cursor: "pointer", fontSize: 13, color: "#333", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        {/* Next */}
        <button
          onClick={next}
          style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid #ccc", background: "white", cursor: "pointer", fontSize: 13, color: "#333", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          ⏭
        </button>

      </div>

      {/* Footer */}
      <p style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 11,
        color: "#bbb",
        marginTop: 32,
      }}>
        made with ♥ · <a href="/" style={{ color: "#bbb", textDecoration: "none" }}>make your own</a>
      </p>

      {/* Hidden audio */}
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
