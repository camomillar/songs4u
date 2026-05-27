"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Image from "next/image";
import HeartParticles from "@/components/HeartParticles";
import PixelAudioPlayer from "@/components/PixelAudioPlayer";
import { decodePlaylist } from "@/lib/encode";
import { getThumbnail } from "@/lib/youtube";

function ShareContent() {
  const params = useSearchParams();
  const encoded = params.get("d");
  const playlist = encoded ? decodePlaylist(encoded) : null;

  // activeIndex drives ONE persistent player — clicking a song updates it,
  // clicking again (or close) hides it. No unmount/remount on song switch.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!playlist) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <p style={{ fontSize: 24, color: "var(--accent2)", marginBottom: 16 }}>♥</p>
        <p style={{ fontSize: 8, color: "var(--text2)" }}>This playlist link looks broken.</p>
      </div>
    );
  }

  const activeSong = activeIndex !== null ? playlist.songs[activeIndex] : null;

  return (
    <div className="page-content" style={{ paddingBottom: activeSong ? 160 : 48 }}>
      {/* Header */}
      <div className="share-header">
        <p style={{ fontSize: 22, marginBottom: 12, letterSpacing: 6 }}>♥ ♥ ♥</p>
        <p className="share-to">For {playlist.to}</p>
        {playlist.message && <p className="share-message">"{playlist.message}"</p>}
        {playlist.from && <p className="share-from">— with love, {playlist.from} ♥</p>}
      </div>

      <hr className="pixel-divider" />

      {/* Song list — always visible */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {playlist.songs.map((song, i) => {
          const isActive = i === activeIndex;
          return (
            <div
              key={i}
              className={`pixel-card ${isActive ? "active-song" : ""}`}
              style={{
                padding: 10,
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                outline: isActive ? "3px solid var(--accent2)" : "none",
                outlineOffset: "-3px",
              }}
              onClick={() => setActiveIndex(isActive ? null : i)}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Image
                  src={getThumbnail(song.id)}
                  alt={song.title}
                  width={80}
                  height={45}
                  unoptimized
                  style={{ border: "2px solid var(--text)", display: "block" }}
                />
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isActive ? "rgba(61,0,21,0.5)" : "rgba(61,0,21,0.25)",
                  fontSize: 16, color: "white",
                }}>
                  {isActive ? "♥" : "▶"}
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {song.title}
                </p>
                {song.artist && (
                  <p style={{ fontSize: 7, color: "var(--text2)", marginTop: 4 }}>{song.artist}</p>
                )}
              </div>

              <span style={{ fontSize: 16, color: isActive ? "var(--accent2)" : "var(--accent3)", flexShrink: 0 }}>♥</span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p style={{ textAlign: "center", fontSize: 7, color: "var(--accent3)", marginTop: 32, lineHeight: 2.5 }}>
        made with ♥ on Lovelist
        <br />
        <a href="/" style={{ color: "var(--accent2)", textDecoration: "none" }}>make your own →</a>
      </p>

      {/* Single persistent player — stays mounted, just changes videoId */}
      {activeSong && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          padding: "12px 16px",
          background: "var(--card)",
          borderTop: "4px solid var(--text)",
          boxShadow: "0 -4px 0 0 var(--shadow)",
          zIndex: 50,
          maxWidth: 640,
          margin: "0 auto",
        }}>
          <PixelAudioPlayer
            videoId={activeSong.id}
            title={activeSong.title}
            artist={activeSong.artist}
            onClose={() => setActiveIndex(null)}
          />
        </div>
      )}
    </div>
  );
}

export default function SharePage() {
  return (
    <div className="app-wrapper">
      <HeartParticles />
      <Suspense fallback={
        <div style={{ textAlign: "center", padding: 48 }}>
          <p style={{ fontSize: 8, color: "var(--text2)" }}>Loading<span className="loading-dots" /></p>
        </div>
      }>
        <ShareContent />
      </Suspense>
    </div>
  );
}
