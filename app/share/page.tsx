"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Image from "next/image";
import PixelAudioPlayer from "@/components/PixelAudioPlayer";
import { decodePlaylist } from "@/lib/encode";
import { getThumbnail } from "@/lib/youtube";

/* ── Closed case ─────────────────────────────────────────────── */
function ClosedCase({ onOpen }: { onOpen: () => void }) {
  return (
    <div
      onClick={onOpen}
      style={{
        minHeight: "100vh",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        cursor: "pointer",
      }}
    >
      <Image
        src="/case-closed.png"
        alt="CD Case"
        width={340}
        height={340}
        style={{ objectFit: "contain" }}
        priority
        onError={() => {}} // fallback handled below
      />
      <p style={{
        fontFamily: "'Lora', serif",
        fontStyle: "italic",
        fontSize: 16,
        color: "#999",
        letterSpacing: 0.3,
      }}>
        click to open
      </p>
    </div>
  );
}

/* ── Open case ───────────────────────────────────────────────── */
function OpenCase({
  to, from, message, songs, currentIndex, setCurrentIndex,
  isPlaying, audioActive, setAudioActive, setIsPlaying,
}: {
  to: string; from: string; message: string;
  songs: { id: string; title: string; artist: string }[];
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
  isPlaying: boolean;
  audioActive: boolean;
  setAudioActive: (v: boolean) => void;
  setIsPlaying: (v: boolean) => void;
}) {
  const total = songs.length;
  const song = songs[currentIndex];

  const next = () => {
    const ni = (currentIndex + 1) % total;
    setCurrentIndex(ni);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      animation: "fadeUp 0.5s ease",
    }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Open jewel case */}
      <div style={{
        display: "flex",
        width: "100%",
        maxWidth: 560,
        height: 280,
        boxShadow: "0 8px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)",
        borderRadius: 3,
        overflow: "hidden",
      }}>

        {/* LEFT — liner notes / letter */}
        <div style={{
          width: 220,
          flexShrink: 0,
          background: "#fafafa",
          borderRight: "1px solid rgba(0,0,0,0.07)",
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}>
          <p style={{
            fontFamily: "'Lora', serif",
            fontStyle: "italic",
            fontSize: 14,
            color: "#222",
            lineHeight: 1.9,
            marginBottom: 6,
          }}>
            My dearest {to},
          </p>
          {message && (
            <p style={{
              fontFamily: "'Lora', serif",
              fontStyle: "italic",
              fontSize: 13,
              color: "#444",
              lineHeight: 1.9,
              marginBottom: 6,
            }}>
              {message}
            </p>
          )}
          {from && (
            <p style={{
              fontFamily: "'Lora', serif",
              fontStyle: "italic",
              fontSize: 13,
              color: "#333",
              lineHeight: 1.9,
            }}>
              Forever yours,<br />
              {from} <span style={{ color: "#e03050" }}>❤</span>
            </p>
          )}
        </div>

        {/* RIGHT — disc tray */}
        <div style={{
          flex: 1,
          background: "linear-gradient(160deg, #1e1e1e 0%, #111 100%)",
          borderLeft: "10px solid #0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}>
          {/* Tray groove ring */}
          <div style={{
            position: "absolute",
            width: 220, height: 220,
            borderRadius: "50%",
            background: "radial-gradient(circle, #2a2a2a 0%, #161616 100%)",
            boxShadow: "inset 0 0 30px rgba(0,0,0,0.6)",
          }} />
          {/* CD */}
          <Image
            src="/cd.png"
            alt="CD"
            width={190}
            height={190}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
              position: "relative",
              zIndex: 1,
              animation: "cd-spin 4s linear infinite",
              animationPlayState: isPlaying ? "running" : "paused",
            }}
          />
        </div>
      </div>

      {/* Player — below the tray, right-aligned */}
      <div style={{
        width: "100%",
        maxWidth: 560,
        display: "flex",
        justifyContent: "flex-end",
        marginTop: 16,
      }}>
        <div style={{
          width: 310,
          background: "#f7f7f7",
          borderRadius: 10,
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        }}>
          {/* Thumbnail */}
          <Image
            src={getThumbnail(song.id)}
            alt={song.title}
            width={44}
            height={44}
            unoptimized
            style={{ borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
          />

          {/* Title + artist */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 13, fontWeight: 600,
              color: "#111",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}>
              {song.title}
            </p>
            <p style={{
              fontSize: 11,
              color: "#888",
              marginTop: 2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}>
              {song.artist}
            </p>
          </div>

          {/* Play/pause button */}
          <button
            onClick={() => setAudioActive(true)}
            style={{
              width: 32, height: 32,
              borderRadius: "50%",
              border: "1.5px solid #ccc",
              background: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              fontSize: 12, color: "#333",
              flexShrink: 0,
            }}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>

          {/* Next button */}
          <button
            onClick={next}
            style={{
              width: 32, height: 32,
              borderRadius: "50%",
              border: "1.5px solid #ccc",
              background: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              fontSize: 12, color: "#333",
              flexShrink: 0,
            }}
          >
            ⏭
          </button>
        </div>
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
      {audioActive && (
        <div style={{ display: "none" }}>
          <PixelAudioPlayer
            videoId={song.id}
            title={song.title}
            artist={song.artist}
            onClose={() => setAudioActive(false)}
            onPlayStateChange={setIsPlaying}
          />
        </div>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
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
        <p style={{ fontFamily: "system-ui", fontSize: 14, color: "#999" }}>Link not found.</p>
      </div>
    );
  }

  if (!isOpen) return <ClosedCase onOpen={() => setIsOpen(true)} />;

  return (
    <OpenCase
      to={playlist.to}
      from={playlist.from}
      message={playlist.message}
      songs={playlist.songs}
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
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "system-ui", fontSize: 14, color: "#999" }}>Loading...</p>
      </div>
    }>
      <ShareContent />
    </Suspense>
  );
}
