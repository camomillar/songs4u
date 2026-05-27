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
  songs: { title: string; artist: string }[];
  total: number;
  onBack: () => void;
}

const W = 700;
const H = 340;
const PW = W / 2;

type Phase = "closed" | "opening" | "open";

export default function JewelCase({
  to, from, message, bgColor,
  isPlaying, ready, onTogglePlay, onNext,
  song, songs, total, onBack,
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
          {/* Shadow wrapper — kept separate so filter doesn't flatten preserve-3d */}
          <div style={{ filter: "drop-shadow(12px 20px 24px rgba(0,0,0,0.4)) drop-shadow(4px 6px 8px rgba(0,0,0,0.25))" }}>
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
            {/* ── BACK FACE — black ── */}
            <div style={{
              position: "absolute", inset: 0,
              background: "#0a0a0a",
              transform: "rotateY(180deg) translateZ(16px)",
              backfaceVisibility: "hidden",
            }} />

            {/* ── TOP FACE — light gray edge ── */}
            <div style={{
              position: "absolute", top: 0, left: 0, width: "100%", height: 16,
              background: "linear-gradient(to bottom, #d8d8da, #c8c8ca)",
              transformOrigin: "top center",
              transform: "rotateX(-90deg)",
            }} />

            {/* ── BOTTOM FACE — light gray edge ── */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, width: "100%", height: 16,
              background: "linear-gradient(to top, #c0c0c2, #ccccce)",
              transformOrigin: "bottom center",
              transform: "rotateX(90deg)",
            }} />

            {/* ── RIGHT FACE — light gray edge ── */}
            <div style={{
              position: "absolute", top: 0, right: 0, width: 16, height: "100%",
              background: "linear-gradient(to right, #ccccce, #d4d4d6)",
              transformOrigin: "right center",
              transform: "rotateY(-90deg)",
            }} />

            {/* ── LEFT FACE — dark spine ── */}
            <div style={{
              position: "absolute", top: 0, left: 0, width: 16, height: "100%",
              background: "#1e1e1e",
              transformOrigin: "left center",
              transform: "rotateY(90deg)",
              overflow: "hidden",
            }}>
              {Array.from({ length: 22 }, (_, i) => (
                <div key={i} style={{
                  position: "absolute",
                  top: `${i * 4.6}%`, left: 2, right: 2, height: 1.5,
                  background: "rgba(255,255,255,0.08)",
                }} />
              ))}
            </div>

            {/* ── FRONT FACE — clear plastic ── */}
            <div style={{
              position: "absolute", inset: 0,
              background: "#e2e2e4",
              backfaceVisibility: "hidden",
              overflow: "hidden",
              border: "1px solid rgba(0,0,0,0.1)",
            }}>
              {/* Spine strip on front face */}
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: 18,
                background: "linear-gradient(to right, #1a1a1a, #333 50%, #1a1a1a)",
              }} />
              {/* Clear plastic sheen */}
              <div style={{ position: "absolute", left: 18, top: 0, right: 0, bottom: 0 }}>
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(240,240,242,0.3) 55%, rgba(210,210,215,0.5) 100%)",
                }} />
                <div style={{
                  position: "absolute", top: 0, right: 0, width: "55%", height: "50%",
                  background: "radial-gradient(ellipse at top right, rgba(255,255,255,0.9) 0%, transparent 70%)",
                }} />
                <div style={{
                  position: "absolute", inset: 6,
                  border: "1px solid rgba(0,0,0,0.05)",
                }} />
              </div>
            </div>

          </div>
          </div>{/* end shadow wrapper */}

          {phase === "closed" && (
            <p
              onClick={handleOpen}
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
            {/* ── OPEN CASE MOCKUP ── */}
            <div style={{
              display: "flex",
              maxWidth: "95vw",
              boxShadow: "0 16px 48px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.15)",
              borderRadius: 3,
              overflow: "hidden",
            }}>

              {/* ── LEFT: Liner notes panel ── */}
              <div style={{
                width: PW, height: H,
                background: "linear-gradient(160deg, #f8f8f8 0%, #efefef 100%)",
                position: "relative",
                borderRight: "1px solid #ddd",
              }}>
                {/* Corner clips — 4 positions */}
                {[
                  { top: 10, left: 10 }, { top: 10, right: 10 },
                  { bottom: 10, left: 10 }, { bottom: 10, right: 10 },
                ].map((pos, i) => (
                  <div key={i} style={{
                    position: "absolute", ...pos,
                    width: 18, height: 18, borderRadius: "50%",
                    background: "linear-gradient(135deg, #e8e8ea, #f5f5f7)",
                    border: "1px solid #ccc",
                    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.12), 0 1px 2px rgba(255,255,255,0.8)",
                  }} />
                ))}

                {/* Song list */}
                <div style={{
                  position: "absolute", inset: 0,
                  padding: "20px 18px",
                  display: "flex", flexDirection: "column", justifyContent: "center",
                  gap: 6,
                  overflow: "hidden",
                }}>
                  {songs.map((s, i) => (
                    <p key={i} style={{
                      fontFamily: "'OrdinaryLetter', cursive",
                      fontSize: 11,
                      color: "rgba(20,20,50,0.72)",
                      margin: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      lineHeight: 1.3,
                    }}>
                      {i + 1}. {s.artist && `${s.artist} - `}{s.title}
                    </p>
                  ))}
                </div>
              </div>

              {/* ── CENTER HINGE ── */}
              <div style={{
                width: 10, height: H, flexShrink: 0,
                background: "linear-gradient(to right, #1a1a1a, #3a3a3a 50%, #1a1a1a)",
              }} />

              {/* ── RIGHT: CD tray ── */}
              <div style={{
                width: PW, height: H,
                background: "linear-gradient(160deg, #3a3a3c 0%, #252527 100%)",
                position: "relative",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {/* Tray corner bumps */}
                {[
                  { top: 8, left: 8 }, { top: 8, right: 8 },
                  { bottom: 8, left: 8 }, { bottom: 8, right: 8 },
                  { top: "50%", left: 6, transform: "translateY(-50%)" },
                  { top: "50%", right: 6, transform: "translateY(-50%)" },
                ].map((pos, i) => (
                  <div key={i} style={{
                    position: "absolute", ...pos,
                    width: 10, height: 10, borderRadius: "50%",
                    background: "radial-gradient(circle at 35% 35%, #4a4a4c, #1a1a1c)",
                    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)",
                  }} />
                ))}

                {/* Tray recess ring */}
                <div style={{
                  position: "absolute",
                  width: H * 0.9, height: H * 0.9,
                  borderRadius: "50%",
                  boxShadow: "inset 0 3px 10px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(0,0,0,0.4)",
                }} />

                {/* CD disc — shiny silver iridescent */}
                <div style={{
                  width: H * 0.84, height: H * 0.84,
                  borderRadius: "50%",
                  position: "relative",
                  animation: isPlaying ? "cd-spin 4s linear infinite" : undefined,
                  flexShrink: 0,
                  boxShadow: "0 2px 14px rgba(0,0,0,0.45), 0 0 0 1px rgba(180,180,190,0.4)",
                  // Mirror silver + vivid iridescent + radial streaks
                  background: `
                    radial-gradient(ellipse at 65% 30%, rgba(255,255,255,0.95) 0%, transparent 45%),
                    conic-gradient(
                      from 20deg at 60% 35%,
                      rgba(150,200,255,0.55) 0deg,
                      rgba(150,255,180,0.4) 45deg,
                      rgba(255,150,200,0.5) 90deg,
                      rgba(200,150,255,0.45) 135deg,
                      rgba(150,240,255,0.5) 180deg,
                      rgba(255,230,120,0.4) 225deg,
                      rgba(255,160,130,0.45) 270deg,
                      rgba(150,200,255,0.5) 315deg,
                      rgba(150,200,255,0.55) 360deg
                    ),
                    repeating-conic-gradient(
                      from 0deg,
                      rgba(255,255,255,0.06) 0deg,
                      rgba(180,185,200,0.12) 1.5deg,
                      rgba(255,255,255,0.06) 3deg
                    ),
                    radial-gradient(circle, #f8f8fa 0%, #ececf0 25%, #d8d8e0 55%, #c8c8d4 80%, #b8b8c8 100%)
                  `,
                }}>
                  {/* Outer rim */}
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    boxShadow: "inset 0 0 0 3px rgba(180,180,195,0.5), inset 0 0 14px rgba(0,0,0,0.1)",
                    pointerEvents: "none",
                  }} />
                  {/* Hot specular highlight — top-left bright streak */}
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    background: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 25%, transparent 55%)",
                    pointerEvents: "none",
                  }} />

                  {/* Stacking ring (inner clear area around hub) */}
                  <div style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%,-50%)",
                    width: "30%", height: "30%", borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(200,215,230,0.9) 0%, rgba(180,195,215,0.85) 60%, rgba(160,175,200,0.8) 100%)",
                    boxShadow: "0 0 0 2px rgba(150,165,190,0.6), inset 0 1px 3px rgba(0,0,0,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 2,
                  }}>
                    {/* Center hole */}
                    <div style={{
                      width: "48%", height: "48%", borderRadius: "50%",
                      background: "radial-gradient(circle, #f5f5f6 0%, #e8e8ea 100%)",
                      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2), 0 0 0 1px rgba(150,155,170,0.5)",
                    }} />
                  </div>

                  {/* Message written ON the disc — SVG circular text */}
                  <svg
                    viewBox="0 0 100 100"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 3, overflow: "visible" }}
                  >
                    <defs>
                      {/* Top arcs */}
                      <path id="cdArcTop1" d="M 21,50 A 29,29 0 0 1 79,50" />
                      <path id="cdArcTop2" d="M 13,50 A 37,37 0 0 1 87,50" />
                      {/* Bottom arcs — counter-clockwise so text reads left→right along bottom */}
                      <path id="cdArcBot1" d="M 21,50 A 29,29 0 0 0 79,50" />
                      <path id="cdArcBot2" d="M 13,50 A 37,37 0 0 0 87,50" />
                    </defs>

                    {/* Salutation — top inner */}
                    <text fontFamily="'OrdinaryLetter', cursive" fontSize="10" fill="rgba(15,20,50,0.78)" textAnchor="middle">
                      <textPath href="#cdArcTop1" startOffset="50%">My dearest {to},</textPath>
                    </text>

                    {/* Message — top outer */}
                    {message && (
                      <text fontFamily="'OrdinaryLetter', cursive" fontSize="9" fill="rgba(15,20,50,0.65)" textAnchor="middle">
                        <textPath href="#cdArcTop2" startOffset="50%">{message}</textPath>
                      </text>
                    )}

                    {/* Forever yours — bottom inner */}
                    {from && (
                      <text fontFamily="'OrdinaryLetter', cursive" fontSize="9.5" fill="rgba(15,20,50,0.72)" textAnchor="middle">
                        <textPath href="#cdArcBot1" startOffset="50%">Forever yours,</textPath>
                      </text>
                    )}

                    {/* Name — bottom outer */}
                    {from && (
                      <text fontFamily="'OrdinaryLetter', cursive" fontSize="10" fill="rgba(15,20,50,0.78)" textAnchor="middle">
                        <textPath href="#cdArcBot2" startOffset="50%">{from}</textPath>
                      </text>
                    )}
                  </svg>

                  {/* Groove rings */}
                  {[36, 50, 64, 78].map(r => (
                    <div key={r} style={{
                      position: "absolute", top: "50%", left: "50%",
                      transform: "translate(-50%,-50%)",
                      width: `${r}%`, height: `${r}%`,
                      borderRadius: "50%",
                      border: "0.5px solid rgba(150,150,165,0.12)",
                    }} />
                  ))}
                </div>
              </div>
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
