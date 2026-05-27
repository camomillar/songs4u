"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Image from "next/image";
import HeartParticles from "@/components/HeartParticles";
import PixelAudioPlayer from "@/components/PixelAudioPlayer";
import CDSpinner from "@/components/CDSpinner";
import { decodePlaylist } from "@/lib/encode";
import { getThumbnail } from "@/lib/youtube";

function ShareContent() {
  const params = useSearchParams();
  const encoded = params.get("d");
  const playlist = encoded ? decodePlaylist(encoded) : null;

  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioActive, setAudioActive] = useState(false);

  if (!playlist) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 8, color: "var(--text2)" }}>This link looks broken.</p>
      </div>
    );
  }

  const currentSong = playlist.songs[currentIndex];
  const total = playlist.songs.length;

  const prev = () => setCurrentIndex((i) => (i - 1 + total) % total);
  const next = () => setCurrentIndex((i) => (i + 1) % total);

  const handleSongClick = () => {
    if (!audioActive) {
      setAudioActive(true);
    } else {
      // toggle is handled inside PixelAudioPlayer via isPlaying callback
    }
  };

  // ── CLOSED STATE ──────────────────────────────────────────────
  if (!isOpen) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        {/* CD Case */}
        <div
          onMouseEnter={() => setIsOpen(true)}
          style={{ cursor: "pointer", position: "relative" }}
        >
          {/* Jewel case shell */}
          <div
            style={{
              width: 260,
              height: 260,
              background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(220,220,235,0.4) 100%)",
              border: "3px solid rgba(0,0,0,0.12)",
              borderRadius: 6,
              boxShadow: `
                inset 0 0 30px rgba(255,255,255,0.7),
                0 20px 60px rgba(0,0,0,0.22),
                6px 6px 0 rgba(0,0,0,0.06)
              `,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "scale(1.04) rotate(-1deg)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = `
                inset 0 0 30px rgba(255,255,255,0.7),
                0 28px 70px rgba(0,0,0,0.28),
                6px 6px 0 rgba(0,0,0,0.06)
              `;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "";
              (e.currentTarget as HTMLDivElement).style.boxShadow = `
                inset 0 0 30px rgba(255,255,255,0.7),
                0 20px 60px rgba(0,0,0,0.22),
                6px 6px 0 rgba(0,0,0,0.06)
              `;
            }}
          >
            {/* Left spine */}
            <div style={{
              position: "absolute", left: 0, top: 0, bottom: 0, width: 18,
              background: "linear-gradient(to right, rgba(0,0,0,0.18), rgba(0,0,0,0.04))",
              borderRight: "1px solid rgba(0,0,0,0.08)",
            }} />

            <Image
              src="/cd.png"
              alt="CD"
              width={210}
              height={210}
              style={{
                borderRadius: "50%",
                objectFit: "cover",
                animation: "cd-spin 12s linear infinite",
                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))",
              }}
              priority
            />
          </div>

          {/* Hint */}
          <p style={{
            fontFamily: "'Dancing Script', cursive",
            fontSize: 20,
            color: "var(--accent2)",
            textAlign: "center",
            marginTop: 16,
            letterSpacing: 0.5,
          }}>
            hover to open ♥
          </p>
        </div>
      </div>
    );
  }

  // ── OPEN STATE ────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 24px 48px",
        maxWidth: 860,
        margin: "0 auto",
        animation: "fadeIn 0.5s ease",
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 28,
        alignItems: "start",
      }}>

        {/* LEFT — letter */}
        <div className="letter-card" style={{ position: "sticky", top: 32 }}>
          <p className="letter-salutation">My dearest {playlist.to},</p>
          {playlist.message && (
            <p className="letter-body">{playlist.message}</p>
          )}
          {playlist.from && (
            <p className="letter-closing">
              Forever yours,<br />{playlist.from} ♥
            </p>
          )}
          <div className="letter-seal">♥</div>
        </div>

        {/* RIGHT — CD + current song */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <CDSpinner isPlaying={isPlaying} />

          {/* Current song card */}
          <div
            className="pixel-card"
            style={{ width: "100%", padding: 14, cursor: "pointer" }}
            onClick={handleSongClick}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Prev */}
              <button
                className="pixel-btn ghost"
                style={{ fontSize: 12, padding: "8px 10px", flexShrink: 0 }}
                onClick={(e) => { e.stopPropagation(); prev(); }}
              >
                ◀
              </button>

              {/* Thumbnail + info */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Image
                    src={getThumbnail(currentSong.id)}
                    alt={currentSong.title}
                    width={64}
                    height={36}
                    unoptimized
                    style={{ border: "2px solid var(--text)", display: "block" }}
                  />
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(61,0,21,0.3)", fontSize: 14, color: "white",
                  }}>
                    {isPlaying ? "⏸" : "▶"}
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {currentSong.title}
                  </p>
                  {currentSong.artist && (
                    <p style={{ fontSize: 6, color: "var(--text2)", marginTop: 3 }}>
                      {currentSong.artist}
                    </p>
                  )}
                </div>
              </div>

              {/* Next */}
              <button
                className="pixel-btn ghost"
                style={{ fontSize: 12, padding: "8px 10px", flexShrink: 0 }}
                onClick={(e) => { e.stopPropagation(); next(); }}
              >
                ▶
              </button>
            </div>

            {/* Dot indicators */}
            {total > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
                {playlist.songs.map((_, i) => (
                  <span
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
                    style={{
                      width: 8, height: 8,
                      borderRadius: "50%",
                      background: i === currentIndex ? "var(--accent2)" : "var(--accent3)",
                      display: "inline-block",
                      cursor: "pointer",
                      border: "2px solid var(--text)",
                      transition: "background 0.2s",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Song count */}
          <p style={{ fontSize: 7, color: "var(--text2)", marginTop: 8 }}>
            {currentIndex + 1} / {total}
          </p>
        </div>
      </div>

      {/* Hidden audio */}
      {audioActive && (
        <div style={{ display: "none" }}>
          <PixelAudioPlayer
            videoId={currentSong.id}
            title={currentSong.title}
            artist={currentSong.artist}
            onClose={() => setAudioActive(false)}
            onPlayStateChange={setIsPlaying}
          />
        </div>
      )}

      {/* Footer */}
      <p style={{ textAlign: "center", fontSize: 7, color: "var(--accent3)", marginTop: 40, lineHeight: 2.5 }}>
        made with ♥ on Lovelist —{" "}
        <a href="/" style={{ color: "var(--accent2)", textDecoration: "none" }}>make your own</a>
      </p>
    </div>
  );
}

export default function SharePage() {
  return (
    <div className="app-wrapper">
      <HeartParticles />
      <Suspense fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: 8, color: "var(--text2)" }}>Loading<span className="loading-dots" /></p>
        </div>
      }>
        <ShareContent />
      </Suspense>
    </div>
  );
}
