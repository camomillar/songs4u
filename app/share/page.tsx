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
    <div style={{ minHeight: "100vh", padding: "32px 24px 120px", maxWidth: 900, margin: "0 auto" }}>

      {/* Two-column layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        alignItems: "start",
      }}>

        {/* LEFT — letter */}
        <div className="letter-card" style={{ position: "sticky", top: 24 }}>
          <p className="letter-salutation">
            My dearest {playlist.to},
          </p>

          {playlist.message && (
            <p className="letter-body">{playlist.message}</p>
          )}

          {playlist.from && (
            <p className="letter-closing">
              Forever yours,<br />
              {playlist.from} ♥
            </p>
          )}

          <div className="letter-seal">♥</div>
        </div>

        {/* RIGHT — playlist */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 8, color: "var(--text2)", letterSpacing: 1, marginBottom: 4 }}>
            ♪ {playlist.songs.length} SONGS
          </p>

          {playlist.songs.map((song, i) => {
            const isActive = i === activeIndex;
            return (
              <div
                key={i}
                className="pixel-card"
                style={{
                  padding: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  outline: isActive ? "3px solid var(--accent2)" : "none",
                  outlineOffset: "-3px",
                  background: isActive ? "var(--card2)" : "var(--card)",
                }}
                onClick={() => setActiveIndex(isActive ? null : i)}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Image
                    src={getThumbnail(song.id)}
                    alt={song.title}
                    width={72}
                    height={40}
                    unoptimized
                    style={{ border: "2px solid var(--text)", display: "block" }}
                  />
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: isActive ? "rgba(61,0,21,0.5)" : "rgba(61,0,21,0.25)",
                    fontSize: 14, color: "white",
                  }}>
                    {isActive ? "♥" : "▶"}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {song.title}
                  </p>
                  {song.artist && (
                    <p style={{ fontSize: 6, color: "var(--text2)", marginTop: 3 }}>{song.artist}</p>
                  )}
                </div>

                <span style={{ fontSize: 14, color: isActive ? "var(--accent2)" : "var(--accent3)", flexShrink: 0 }}>♥</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed bottom player */}
      {activeSong && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          padding: "12px 16px",
          background: "var(--card)",
          borderTop: "4px solid var(--text)",
          boxShadow: "0 -4px 0 0 var(--shadow)",
          zIndex: 50,
        }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <PixelAudioPlayer
              videoId={activeSong.id}
              title={activeSong.title}
              artist={activeSong.artist}
              onClose={() => setActiveIndex(null)}
            />
          </div>
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
