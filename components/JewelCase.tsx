"use client";
import { useEffect, useRef, useState } from "react";
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
  coverArt?: string; // first song's album art for the case cover
  total: number;
  onBack: () => void;
}

const W = 560;
const H = 270;
const PW = W / 2;

type Phase = "closed" | "opening" | "open";

export default function JewelCase({
  to, from, message, bgColor,
  isPlaying, ready, onTogglePlay, onNext,
  song, coverArt, total, onBack,
}: Props) {
  const [phase, setPhase] = useState<Phase>("closed");

  // 3D drag for closed state
  const caseRef = useRef<HTMLDivElement>(null);
  const rot = useRef({ x: 4, y: -16 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const idleAngle = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (phase !== "closed") return;

    const tick = () => {
      if (!isDragging.current) {
        idleAngle.current += 0.3;
        rot.current.y = -16 + Math.sin((idleAngle.current * Math.PI) / 180) * 10;
      }
      if (caseRef.current) {
        caseRef.current.style.transform = `perspective(700px) rotateY(${rot.current.y}deg) rotateX(${rot.current.x}deg)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      rot.current.y += (e.clientX - lastPos.current.x) * 0.8;
      rot.current.x = Math.max(-40, Math.min(40, rot.current.x - (e.clientY - lastPos.current.y) * 0.8));
      lastPos.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { isDragging.current = false; };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      rot.current.y += (e.touches[0].clientX - lastPos.current.x) * 0.8;
      rot.current.x = Math.max(-40, Math.min(40, rot.current.x - (e.touches[0].clientY - lastPos.current.y) * 0.8));
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
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
  }, [phase]);

  const handleOpen = () => {
    if (phase !== "closed") return;
    setPhase("opening");
    // halfway through the fold → switch to open layout
    setTimeout(() => setPhase("open"), 420);
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
      padding: "40px 16px",
      transition: "background 0.4s ease",
    }}>
      <style>{`
        @keyframes caseFoldOut {
          from { transform: perspective(900px) rotateY(0deg); opacity: 1; }
          to   { transform: perspective(900px) rotateY(-90deg); opacity: 0; }
        }
        @keyframes caseUnfold {
          from { transform: perspective(900px) rotateY(90deg); opacity: 0; }
          to   { transform: perspective(900px) rotateY(0deg); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cd-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* Back button (open state only) */}
      {phase === "open" && (
        <button onClick={onBack} style={{
          position: "fixed", top: 20, left: 20,
          width: 40, height: 40, borderRadius: "50%",
          border: "none", background: "rgba(0,0,0,0.08)",
          cursor: "pointer", fontSize: 18, color: "#555",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10,
        }}>←</button>
      )}

      {/* ── CLOSED: CSS mockup of a jewel case ── */}
      {(phase === "closed" || phase === "opening") && (
        <div style={{
          animation: phase === "opening" ? "caseFoldOut 0.42s ease-in forwards" : undefined,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
        }}>
          {/* The case — draggable in 3D */}
          <div
            ref={caseRef}
            onMouseDown={(e) => { e.preventDefault(); isDragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; }}
            onTouchStart={(e) => { isDragging.current = true; lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
            style={{
              width: 340, height: 340,
              position: "relative",
              flexShrink: 0,
              cursor: "grab",
              userSelect: "none",
              willChange: "transform",
              transformStyle: "preserve-3d",
            }}
          >
            {/* ── TOP face (thickness) ── */}
            <div style={{
              position: "absolute", top: 0, left: 0, width: "100%", height: 16,
              transformOrigin: "top center",
              transform: "rotateX(90deg)",
              background: "linear-gradient(to bottom, #2a2a2a, #1e1e1e)",
            }} />
            {/* ── BOTTOM face (thickness) ── */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, width: "100%", height: 16,
              transformOrigin: "bottom center",
              transform: "rotateX(-90deg)",
              background: "linear-gradient(to top, #1e1e1e, #2a2a2a)",
            }} />
            {/* ── RIGHT face (thickness) ── */}
            <div style={{
              position: "absolute", top: 0, right: 0, width: 16, height: "100%",
              transformOrigin: "right center",
              transform: "rotateY(90deg)",
              background: "linear-gradient(to right, #1e1e1e, #2a2a2a)",
            }} />
            {/* ── Spine — ribbed like a real jewel case ── */}
            <div style={{
              position: "absolute", left: 0, top: 0, bottom: 0, width: 16,
              background: "#1a1a1a",
              borderRadius: "3px 0 0 3px",
              zIndex: 3,
              overflow: "hidden",
            }}>
              {/* Ribs */}
              {Array.from({ length: 18 }, (_, i) => (
                <div key={i} style={{
                  position: "absolute",
                  top: `${i * 5.6}%`, left: 2, right: 2, height: 2,
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 1,
                }} />
              ))}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to right, #111, #222 50%, #111)",
              }} />
            </div>

            {/* ── Front face — album art fills the cover ── */}
            <div style={{
              position: "absolute", left: 16, top: 0, right: 0, bottom: 0,
              background: "#0a0a0a",
              borderRadius: "0 3px 3px 0",
              overflow: "hidden",
            }}>
              {/* Album artwork */}
              {coverArt ? (
                <Image
                  src={coverArt}
                  alt="cover"
                  fill
                  unoptimized
                  style={{ objectFit: "cover" }}
                />
              ) : (
                // Fallback: dark tray with disc silhouette
                <div style={{
                  position: "absolute", inset: 0,
                  background: "#111",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{
                    width: 200, height: 200, borderRadius: "50%",
                    background: "conic-gradient(from 0deg, rgba(130,130,170,0.07), rgba(170,150,200,0.05), rgba(130,130,170,0.07))",
                    border: "1px solid rgba(255,255,255,0.03)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#090909" }} />
                  </div>
                </div>
              )}

              {/* Plastic overlay / sheen */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 40%, rgba(0,0,0,0.2) 100%)",
              }} />
              {/* Top edge glint */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 1,
                background: "rgba(255,255,255,0.12)", pointerEvents: "none",
              }} />
            </div>

          </div>

          {phase === "closed" && (
            <p
              style={{
                fontFamily: "'Lora', serif", fontStyle: "italic",
                fontSize: 15, color: "#aaa", cursor: "pointer",
                letterSpacing: 0.3, borderBottom: "1px solid #ddd", paddingBottom: 2,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e03050")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#aaa")}
            >
              click here to open ♥
            </p>
          )}
        </div>
      )}

      {/* ── OPEN: two-panel layout ── */}
      {phase === "open" && (
        <>
          <div style={{
            perspective: "1200px",
            animation: "caseUnfold 0.45s ease-out forwards",
          }}>
            <div style={{
              position: "relative",
              width: W, height: H,
              maxWidth: "95vw",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}>
              {/* RIGHT PANEL: CD tray */}
              <div style={{
                position: "absolute", right: 0, width: PW, height: H,
                background: "linear-gradient(150deg, #1e1e1e 0%, #0d0d0d 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: H * 0.88, height: H * 0.88, borderRadius: "50%",
                  background: "radial-gradient(circle at 40% 40%, #2a2a2a 0%, #111 60%, #080808 100%)",
                  boxShadow: "inset 0 4px 20px rgba(0,0,0,0.7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                }}>
                  <Image
                    src="/cd.png"
                    alt="CD"
                    width={Math.round(H * 0.78)}
                    height={Math.round(H * 0.78)}
                    style={{
                      borderRadius: "50%", objectFit: "cover",
                      animation: isPlaying ? "cd-spin 4s linear infinite" : undefined,
                    }}
                  />
                  <div style={{
                    position: "absolute", width: 18, height: 18, borderRadius: "50%",
                    background: "#0a0a0a", boxShadow: "0 0 0 3px #1a1a1a", zIndex: 2,
                  }} />
                </div>
              </div>

              {/* LEFT PANEL: Letter */}
              <div style={{
                position: "absolute", left: 0, width: PW, height: H,
                background: "#fafafa",
                fontFamily: "'Breathing', cursive",
                padding: "20px 18px",
                display: "flex", flexDirection: "column", justifyContent: "center",
                backgroundImage: "repeating-linear-gradient(transparent 0px, transparent 28px, rgba(200,130,130,0.13) 28px, rgba(200,130,130,0.13) 29px)",
                borderRight: "3px solid rgba(200,130,130,0.15)",
                zIndex: 2,
              }}>
                <p style={{ fontSize: 15, color: "#1d3d8e", lineHeight: 1.5, marginBottom: 10 }}>My dearest {to},</p>
                {message && <p style={{ fontSize: 12, color: "#1d3d8e", lineHeight: 1.65, marginBottom: 10 }}>{message}</p>}
                {from && (
                  <>
                    <p style={{ fontSize: 12, color: "#1d3d8e", lineHeight: 1.65 }}>Forever yours,</p>
                    <p style={{ fontSize: 12, color: "#1d3d8e", marginTop: 2 }}>{from}</p>
                  </>
                )}
              </div>

              {/* Spine */}
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 8, background: "linear-gradient(to right, #050505, #181818)", zIndex: 4 }} />
              {/* Hinge */}
              <div style={{ position: "absolute", left: PW - 4, top: 0, bottom: 0, width: 8, background: "linear-gradient(to right, #080808, #282828, #080808)", zIndex: 1 }} />
            </div>
          </div>

          {/* Player */}
          <div style={{
            width: "100%", maxWidth: W,
            background: "white", borderRadius: 16,
            padding: "12px 16px",
            display: "flex", alignItems: "center", gap: 12,
            boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
            animation: "fadeUp 0.4s ease 0.3s both",
          }}>
            {song.albumArt ? (
              <Image src={song.albumArt} alt={song.title} width={52} height={52} unoptimized
                style={{ borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: 10, background: "#eee", flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#111", fontFamily: "system-ui", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</p>
              <p style={{ fontSize: 12, color: "#888", fontFamily: "system-ui", marginTop: 2 }}>{song.artist}</p>
            </div>
            <button onClick={onTogglePlay} disabled={!ready} style={{
              width: 40, height: 40, borderRadius: "50%",
              background: ready ? "#111" : "#ccc", border: "none",
              cursor: ready ? "pointer" : "not-allowed",
              color: "white", fontSize: 14, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{isPlaying ? "⏸" : "▶"}</button>
            {total > 1 && (
              <button onClick={onNext} style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "transparent", border: "1.5px solid #ddd",
                cursor: "pointer", fontSize: 14, color: "#333", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>⏭</button>
            )}
          </div>

          <p style={{ fontFamily: "system-ui", fontSize: 11, color: "#bbb" }}>
            made with ♥ · <a href="/" style={{ color: "#bbb", textDecoration: "none" }}>make your own</a>
          </p>
        </>
      )}
    </div>
  );
}
