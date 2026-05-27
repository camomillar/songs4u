"use client";
import { useState } from "react";
import Image from "next/image";

interface Props {
  to: string;
  from: string;
  message: string;
  bgColor?: string;
  isPlaying: boolean;
  ready: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  song: { title: string; artist: string; albumArt?: string };
  total: number;
  onBack: () => void;
}

const W = 560;   // total case width
const H = 270;   // case height
const PW = W / 2; // each panel = 280px

export default function JewelCase({
  to, from, message, bgColor,
  isPlaying, ready, onTogglePlay, onNext,
  song, total, onBack,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{
      minHeight: "100vh",
      background: bgColor || "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
      padding: "40px 16px",
      transition: "background 0.4s ease",
    }}>

      {/* Back button */}
      <button onClick={onBack} style={{
        position: "fixed", top: 20, left: 20,
        width: 40, height: 40, borderRadius: "50%",
        border: "none", background: "rgba(0,0,0,0.08)",
        cursor: "pointer", fontSize: 18, color: "#555",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 10,
      }}>←</button>

      {/* ── The Jewel Case ── */}
      <div style={{ perspective: "1200px" }}>
        <div style={{
          position: "relative",
          width: W, height: H,
          maxWidth: "95vw",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 6px 20px rgba(0,0,0,0.2)",
          // 3D tilt when closed, flat when open
          transform: isOpen
            ? "rotateY(0deg) rotateX(0deg)"
            : "rotateY(-14deg) rotateX(3deg)",
          transition: "transform 0.85s cubic-bezier(0.42, 0, 0.18, 1.2)",
        }}>

          {/* ── RIGHT PANEL: CD tray (always visible) ── */}
          <div style={{
            position: "absolute", right: 0, width: PW, height: H,
            background: "linear-gradient(150deg, #1e1e1e 0%, #0d0d0d 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}>
            {/* Tray groove ring */}
            <div style={{
              width: H * 0.88, height: H * 0.88,
              borderRadius: "50%",
              background: "radial-gradient(circle at 40% 40%, #2a2a2a 0%, #111 60%, #080808 100%)",
              boxShadow: "inset 0 4px 20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Image
                src="/cd.png"
                alt="CD"
                width={Math.round(H * 0.78)}
                height={Math.round(H * 0.78)}
                style={{
                  borderRadius: "50%",
                  objectFit: "cover",
                  animation: isPlaying ? "cd-spin 4s linear infinite" : undefined,
                  opacity: isOpen ? 1 : 0.15,
                  transition: "opacity 0.5s ease 0.5s",
                }}
              />
            </div>
            {/* Tray centre hub */}
            <div style={{
              position: "absolute",
              width: 20, height: 20, borderRadius: "50%",
              background: "#0a0a0a",
              boxShadow: "0 0 0 3px #1a1a1a",
              zIndex: 2,
            }} />
          </div>

          {/* ── LEFT PANEL: Front cover — rotates on hinge ── */}
          <div
            onClick={() => !isOpen && setIsOpen(true)}
            style={{
              position: "absolute", left: 0, width: PW, height: H,
              transformOrigin: "right center",
              transform: isOpen ? "rotateY(-168deg)" : "rotateY(0deg)",
              transition: "transform 0.85s cubic-bezier(0.42, 0, 0.18, 1.2)",
              transformStyle: "preserve-3d",
              cursor: isOpen ? "default" : "pointer",
              zIndex: 2,
            }}
          >
            {/* FRONT FACE — case exterior with artwork */}
            <div style={{
              position: "absolute", inset: 0,
              background: "#111",
              backfaceVisibility: "hidden",
              overflow: "hidden",
            }}>
              {/* Artwork photo — takes up full face */}
              <Image
                src={song.albumArt || "/cd.png"}
                alt="cover"
                fill
                unoptimized={!!song.albumArt}
                style={{ objectFit: "cover" }}
              />
              {/* Plastic sheen overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)",
                pointerEvents: "none",
              }} />
              {/* Bottom hint */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                padding: "8px 10px",
                background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)",
                display: "flex", justifyContent: "flex-end",
              }}>
                <p style={{
                  fontFamily: "'Lora', serif", fontStyle: "italic",
                  fontSize: 10, color: "rgba(255,255,255,0.6)", letterSpacing: 0.5,
                }}>
                  click to open ♥
                </p>
              </div>
            </div>

            {/* BACK FACE — letter (liner notes) */}
            <div style={{
              position: "absolute", inset: 0,
              background: "#fafafa",
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              padding: "22px 20px",
              display: "flex", flexDirection: "column", justifyContent: "center",
              fontFamily: "'Breathing', cursive",
              // Lined paper
              backgroundImage: "repeating-linear-gradient(transparent 0px, transparent 28px, rgba(200,130,130,0.13) 28px, rgba(200,130,130,0.13) 29px)",
              // Left margin line
              borderLeft: "3px solid rgba(200,130,130,0.2)",
            }}>
              <p style={{ fontSize: 15, color: "#1d3d8e", lineHeight: 1.5, marginBottom: 10 }}>
                My dearest {to},
              </p>
              {message && (
                <p style={{ fontSize: 13, color: "#1d3d8e", lineHeight: 1.65, marginBottom: 10 }}>
                  {message}
                </p>
              )}
              {from && (
                <>
                  <p style={{ fontSize: 13, color: "#1d3d8e", lineHeight: 1.65 }}>Forever yours,</p>
                  <p style={{ fontSize: 13, color: "#1d3d8e", marginTop: 2 }}>{from}</p>
                </>
              )}
            </div>
          </div>

          {/* ── SPINE (left edge) ── */}
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 8,
            background: "linear-gradient(to right, #050505, #181818)",
            zIndex: 4,
          }} />

          {/* ── HINGE (centre seam) ── */}
          <div style={{
            position: "absolute", left: PW - 4, top: 0, bottom: 0, width: 8,
            background: "linear-gradient(to right, #080808, #282828, #080808)",
            zIndex: isOpen ? 0 : 4,
          }} />
        </div>

        {/* Shadow */}
        <div style={{
          width: W * 0.85, height: 10, margin: "4px auto 0",
          background: "radial-gradient(ellipse, rgba(0,0,0,0.22) 0%, transparent 70%)",
        }} />
      </div>

      {/* ── Player (only when open) ── */}
      {isOpen && (
        <div style={{
          width: "100%", maxWidth: W,
          background: "white", borderRadius: 16,
          padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 12,
          boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
          animation: "fadeUp 0.4s ease 0.4s both",
        }}>
          {song.albumArt ? (
            <Image src={song.albumArt} alt={song.title} width={52} height={52} unoptimized
              style={{ borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: 10, background: "#eee", flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#111", fontFamily: "system-ui", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {song.title}
            </p>
            <p style={{ fontSize: 12, color: "#888", fontFamily: "system-ui", marginTop: 2 }}>
              {song.artist}
            </p>
          </div>
          <button onClick={onTogglePlay} disabled={!ready} style={{
            width: 40, height: 40, borderRadius: "50%",
            background: ready ? "#111" : "#ccc", border: "none",
            cursor: ready ? "pointer" : "not-allowed",
            color: "white", fontSize: 14, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {isPlaying ? "⏸" : "▶"}
          </button>
          {total > 1 && (
            <button onClick={onNext} style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "transparent", border: "1.5px solid #ddd",
              cursor: "pointer", fontSize: 14, color: "#333", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>⏭</button>
          )}
        </div>
      )}

      {/* Footer */}
      <p style={{ fontFamily: "system-ui", fontSize: 11, color: "#bbb" }}>
        made with ♥ · <a href="/" style={{ color: "#bbb", textDecoration: "none" }}>make your own</a>
      </p>
    </div>
  );
}
