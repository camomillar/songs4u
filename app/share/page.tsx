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

  return (
    <div className="page-content">
      {/* Header */}
      <div className="share-header">
        <p style={{ fontSize: 22, marginBottom: 12, letterSpacing: 6 }}>♥ ♥ ♥</p>
        <p className="share-to">For {playlist.to}</p>
        {playlist.message && <p className="share-message">"{playlist.message}"</p>}
        {playlist.from && <p className="share-from">— with love, {playlist.from} ♥</p>}
      </div>

      <hr className="pixel-divider" />

      {/* Song list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {playlist.songs.map((song, i) => (
          <div key={i}>
            {activeIndex === i ? (
              <PixelAudioPlayer
                videoId={song.id}
                title={song.title}
                artist={song.artist}
                onClose={() => setActiveIndex(null)}
              />
            ) : (
              <div
                className="pixel-card"
                style={{ padding: 10, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                onClick={() => setActiveIndex(i)}
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
                  {/* Play overlay */}
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(61,0,21,0.35)", fontSize: 18, color: "white",
                  }}>
                    ▶
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

                <span style={{ fontSize: 16, color: "var(--accent3)", flexShrink: 0 }}>♥</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <p style={{ textAlign: "center", fontSize: 7, color: "var(--accent3)", marginTop: 32, lineHeight: 2.5 }}>
        made with ♥ on Lovelist
        <br />
        <a href="/" style={{ color: "var(--accent2)", textDecoration: "none" }}>
          make your own →
        </a>
      </p>
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
