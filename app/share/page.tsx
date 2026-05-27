"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Image from "next/image";
import HeartParticles from "@/components/HeartParticles";
import PixelAudioPlayer from "@/components/PixelAudioPlayer";
import CDSpinner from "@/components/CDSpinner";
import { decodePlaylist } from "@/lib/encode";
import { getThumbnail } from "@/lib/youtube";

/* ─── Closed jewel case ─────────────────────────────────────── */
function ClosedCase({ onOpen }: { onOpen: () => void }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      {/* The closed case */}
      <div
        onMouseEnter={onOpen}
        style={{
          cursor: "pointer",
          width: 240,
          height: 240,
          position: "relative",
          /* Clear plastic shell */
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(210,215,230,0.45) 100%)",
          border: "3px solid rgba(0,0,0,0.13)",
          borderLeft: "14px solid #3a3a3a",
          borderRadius: 5,
          boxShadow:
            "inset 0 0 28px rgba(255,255,255,0.6), 0 18px 50px rgba(0,0,0,0.22), 5px 5px 0 rgba(0,0,0,0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "";
        }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform =
            "scale(1.04) rotate(-1deg)";
        }}
      >
        {/* CD visible through clear plastic */}
        <Image
          src="/cd.png"
          alt="CD"
          width={195}
          height={195}
          style={{
            borderRadius: "50%",
            objectFit: "cover",
            animation: "cd-spin 14s linear infinite",
            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.18))",
          }}
          priority
        />
      </div>

      <p
        style={{
          fontFamily: "'Dancing Script', cursive",
          fontSize: 22,
          color: "var(--accent2)",
          letterSpacing: 0.5,
        }}
      >
        hover to open ♥
      </p>
    </div>
  );
}

/* ─── Open jewel case ───────────────────────────────────────── */
function OpenCase({
  playlist,
  currentIndex,
  setCurrentIndex,
  isPlaying,
  audioActive,
  setAudioActive,
  setIsPlaying,
}: {
  playlist: ReturnType<typeof decodePlaylist> & object;
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
  isPlaying: boolean;
  audioActive: boolean;
  setAudioActive: (v: boolean) => void;
  setIsPlaying: (v: boolean) => void;
}) {
  const songs = (playlist as { songs: { id: string; title: string; artist: string }[] }).songs;
  const to = (playlist as { to: string }).to;
  const from = (playlist as { from: string }).from;
  const message = (playlist as { message: string }).message;
  const total = songs.length;
  const currentSong = songs[currentIndex];

  const prev = () => setCurrentIndex((currentIndex - 1 + total) % total);
  const next = () => setCurrentIndex((currentIndex + 1) % total);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        animation: "caseOpen 0.6s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <style>{`
        @keyframes caseOpen {
          from { opacity: 0; transform: scale(0.92) perspective(800px) rotateY(-8deg); }
          to   { opacity: 1; transform: scale(1)    perspective(800px) rotateY(0deg); }
        }
      `}</style>

      {/* The open case */}
      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: 820,
          /* outer case border */
          border: "3px solid rgba(0,0,0,0.15)",
          borderRadius: 6,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.22), 6px 6px 0 rgba(0,0,0,0.06)",
        }}
      >
        {/* LEFT — white liner panel */}
        <div
          style={{
            flex: 1,
            background: "#ffffff",
            padding: "40px 36px 48px",
            fontFamily: "'Dancing Script', cursive",
            color: "#3a2010",
            position: "relative",
            backgroundImage: `repeating-linear-gradient(
              transparent 0px, transparent 34px,
              rgba(220,140,140,0.15) 34px, rgba(220,140,140,0.15) 35px
            )`,
            /* left margin line */
            borderRight: "1px solid rgba(220,140,140,0.2)",
          }}
        >
          {/* margin rule */}
          <div style={{
            position: "absolute", top: 0, bottom: 0, left: 52,
            width: 1.5, background: "rgba(220,140,140,0.25)",
          }} />

          <p style={{ fontSize: 26, fontWeight: 700, color: "#7a1530", marginBottom: 18, lineHeight: 1.2 }}>
            My dearest {to},
          </p>
          {message && (
            <p style={{ fontSize: 20, lineHeight: 2, marginBottom: 20 }}>{message}</p>
          )}
          {from && (
            <p style={{ fontSize: 20, fontWeight: 600, color: "#7a1530", textAlign: "right" }}>
              Forever yours,<br />{from} ♥
            </p>
          )}

          {/* Wax seal */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 52, height: 52,
            background: "radial-gradient(circle, #e63c5e 0%, #9b1535 100%)",
            borderRadius: "50%",
            fontSize: 22, color: "white",
            margin: "24px auto 0",
            boxShadow: "0 2px 8px rgba(155,21,53,0.4)",
          }}>
            ♥
          </div>
        </div>

        {/* RIGHT — black disc tray */}
        <div
          style={{
            flex: 1,
            background: "linear-gradient(160deg, #2e2e2e 0%, #1a1a1a 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "28px 20px 20px",
            gap: 16,
            /* spine on left edge */
            borderLeft: "10px solid #111",
          }}
        >
          {/* Tray hub ring */}
          <div style={{
            position: "relative",
            padding: 12,
            background: "radial-gradient(circle, #3a3a3a 0%, #222 100%)",
            borderRadius: "50%",
            boxShadow: "inset 0 0 20px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.4)",
          }}>
            <CDSpinner isPlaying={isPlaying} />
          </div>

          {/* Current song */}
          <div style={{
            width: "100%",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 4,
            padding: "10px 12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Prev */}
              <button
                onClick={prev}
                style={{
                  background: "none", border: "none", color: "rgba(255,255,255,0.7)",
                  fontSize: 14, cursor: "pointer", padding: "4px 6px", flexShrink: 0,
                }}
              >
                ◀
              </button>

              {/* Song info + thumbnail */}
              <div
                style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", minWidth: 0 }}
                onClick={() => setAudioActive(true)}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Image
                    src={getThumbnail(currentSong.id)}
                    alt={currentSong.title}
                    width={52}
                    height={30}
                    unoptimized
                    style={{ border: "1px solid rgba(255,255,255,0.2)", display: "block" }}
                  />
                  <div style={{
                    position: "absolute", inset: 0, display: "flex", alignItems: "center",
                    justifyContent: "center", background: "rgba(0,0,0,0.3)",
                    color: "white", fontSize: 12,
                  }}>
                    {isPlaying ? "⏸" : "▶"}
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontSize: 7, color: "rgba(255,255,255,0.9)",
                    fontFamily: "'Press Start 2P', monospace",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {currentSong.title}
                  </p>
                  {currentSong.artist && (
                    <p style={{
                      fontSize: 6, color: "rgba(255,255,255,0.5)",
                      fontFamily: "'Press Start 2P', monospace",
                      marginTop: 3,
                    }}>
                      {currentSong.artist}
                    </p>
                  )}
                </div>
              </div>

              {/* Next */}
              <button
                onClick={next}
                style={{
                  background: "none", border: "none", color: "rgba(255,255,255,0.7)",
                  fontSize: 14, cursor: "pointer", padding: "4px 6px", flexShrink: 0,
                }}
              >
                ▶
              </button>
            </div>

            {/* Dot indicators */}
            {total > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8 }}>
                {songs.map((_, i) => (
                  <span
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    style={{
                      width: 7, height: 7,
                      borderRadius: "50%",
                      background: i === currentIndex ? "#ff6b8a" : "rgba(255,255,255,0.25)",
                      display: "inline-block",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <p style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 7, color: "var(--accent3)", marginTop: 20, lineHeight: 2.5,
      }}>
        made with ♥ on Lovelist —{" "}
        <a href="/" style={{ color: "var(--accent2)", textDecoration: "none" }}>make your own</a>
      </p>

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
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────── */
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

  if (!isOpen) {
    return <ClosedCase onOpen={() => setIsOpen(true)} />;
  }

  return (
    <OpenCase
      playlist={playlist}
      currentIndex={currentIndex}
      setCurrentIndex={setCurrentIndex}
      isPlaying={isPlaying}
      audioActive={audioActive}
      setAudioActive={setAudioActive}
      setIsPlaying={setIsPlaying}
    />
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
