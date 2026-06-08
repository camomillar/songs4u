"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import HeartParticles, { darkenHex } from "@/components/HeartParticles";
import StoryCard from "@/components/StoryCard";
import { track } from "@vercel/analytics";

interface Props {
  to: string;
  from: string;
  title?: string;
  message: string;
  bgColor?: string;
  isPlaying: boolean;
  ready: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  song: { title: string; artist: string; albumArt?: string };
  songs: { title: string; artist: string }[];
  coverImage?: string;
  total: number;
  onBack: () => void;
  playlistId?: string;
  particles?: "hearts" | "stars" | "notes" | "flowers" | "none";
  stickers?: string[];
  i18n?: { clickToOpen: string; shareToStory: string; noPreview: string; madeWith: string; createOwn: string };
  lang?: "en" | "pt";
}

const W = 700;
const H = 340;
const PW = W / 2;

type Phase = "closed" | "opening" | "open" | "closing";

export default function JewelCase({
  to, from, title, message, bgColor, stickers = [],
  isPlaying, ready, onTogglePlay, onNext, onPrev,
  song, songs, coverImage, total, onBack, playlistId, particles = "hearts", i18n, lang = "pt",
}: Props) {
  const [phase, setPhase] = useState<Phase>("closed");
  const [spinState, setSpinState] = useState<"playing" | "stopping" | "stopped">("stopped");
  const [showStory, setShowStory] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showMessageDrawer, setShowMessageDrawer] = useState(false);
  const openCaseRef = useRef<HTMLDivElement>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preload sticker images so they appear instantly when case opens
  useEffect(() => {
    stickers.forEach(src => {
      if (src.startsWith("/")) {
        const img = new window.Image();
        img.src = src;
      }
    });
  }, [stickers]);

  useEffect(() => {
    if (isPlaying) {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      setSpinState("playing");
    } else {
      if (spinState === "playing") {
        setSpinState("stopping");
        stopTimerRef.current = setTimeout(() => setSpinState("stopped"), 2500);
      }
    }
    return () => { if (stopTimerRef.current) clearTimeout(stopTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

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
        idleAngle.current += 0.6;
        rot.current.y = -16 + Math.sin((idleAngle.current * Math.PI) / 180) * 14;
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

  // Detect dark background to adjust text colors
  const isDark = (() => {
    const hex = (bgColor || "#fff").replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  })();

  const t = i18n ?? { clickToOpen: "Click to open", shareToStory: "Share to Story", noPreview: "no preview available", madeWith: "made with ♥ by", createOwn: "create your own playlist" };

  const handleOpen = () => {
    if (phase !== "closed") return;
    setPhase("opening");
    setTimeout(() => setPhase("open"), 420);
  };

  // Fix background + prevent scroll on mobile
  useEffect(() => {
    const color = bgColor || "#fff";
    document.documentElement.style.background = color;
    document.body.style.background = color;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    return () => {
      document.documentElement.style.background = "";
      document.body.style.background = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [bgColor]);

  return (
    <div style={{
      height: "100vh",
      maxHeight: "-webkit-fill-available",
      background: "transparent",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      padding: "16px",
      transition: "background 0.4s ease",
      position: "relative",
    }}>
      {/* songs4u logo — top left, desktop only */}
      <p style={{
        position: "fixed", top: 24, left: 28,
        fontFamily: "'BitcountGrid', monospace",
        fontSize: 22,
        color: isDark ? "#ffffff" : "#111111",
        margin: 0,
        zIndex: 20,
      }} className="desktop-only-logo">
        songs 4u &lt;3
      </p>
      <style>{`
        .desktop-only-logo { display: block; }
        @media (max-width: 600px) { .desktop-only-logo { display: none; } }
      `}</style>

      <style>{`
        @keyframes caseFoldOut {
          from { transform: perspective(900px) rotateY(0deg); opacity: 1; }
          to   { transform: perspective(900px) rotateY(-90deg); opacity: 0; }
        }
        @keyframes caseUnfold {
          from { transform: perspective(900px) rotateY(90deg); opacity: 0; }
          to   { transform: perspective(900px) rotateY(0deg); opacity: 1; }
        }
        @keyframes caseFoldClose {
          from { transform: perspective(900px) rotateY(0deg); opacity: 1; }
          to   { transform: perspective(900px) rotateY(90deg); opacity: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cd-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes cd-spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @media (max-width: 600px) {
          .case-hinge { display: none !important; }
          .case-closed-wrapper { filter: none !important; }

          /* Scroll-snap pager: liner (message) + CD tray */
          .open-case-container {
            overflow-x: auto !important;
            overflow-y: visible !important;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            max-width: 100vw !important;
            border-radius: 12px !important;
          }
          .open-case-container::-webkit-scrollbar { display: none; }

          .case-liner-panel {
            display: flex !important;
            flex: 0 0 82vw !important;
            width: 82vw !important;
            height: 82vw !important;
            scroll-snap-align: start;
            border-right: none !important;
          }
          .cd-tray-panel {
            flex: 0 0 82vw !important;
            width: 82vw !important;
            height: 82vw !important;
            scroll-snap-align: start;
          }
        }
      `}</style>


      {/* ── CLOSED: CSS mockup of a jewel case ── */}
      {(phase === "closed" || phase === "opening") && (
        <>
        <HeartParticles color={bgColor ? darkenHex(bgColor) : undefined} type={particles} />
        <div style={{
          animation: phase === "opening" ? "caseFoldOut 0.42s ease-in forwards" : undefined,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
        }}>
          {/* Shadow wrapper — kept separate so filter doesn't flatten preserve-3d */}
          <div className="case-closed-wrapper" style={{ filter: "drop-shadow(16px 24px 32px rgba(0,0,0,0.45)) drop-shadow(4px 6px 10px rgba(0,0,0,0.3)) drop-shadow(0px 2px 4px rgba(0,0,0,0.2))" }}>
          {/* The case — draggable in 3D */}
          <div
            ref={caseRef}
            onMouseDown={(e) => { e.preventDefault(); isDragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; }}
            onTouchStart={(e) => { isDragging.current = true; lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
            style={{
              width: 340, height: 340,
              maxWidth: "90vw",
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

            {/* ── FRONT FACE — clear plastic / cover photo ── */}
            <div style={{
              position: "absolute", inset: 0,
              background: "#dcdcde",
              backfaceVisibility: "hidden",
              overflow: "hidden",
              border: "1.5px solid rgba(255,255,255,0.6)",
              borderBottom: "1.5px solid rgba(0,0,0,0.15)",
              borderRight: "1.5px solid rgba(0,0,0,0.1)",
            }}>
              {/* Cover photo (if uploaded) */}
              {coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverImage} alt="cover" style={{ position: "absolute", left: 18, top: 0, right: 0, bottom: 0, width: "calc(100% - 18px)", height: "100%", objectFit: "cover", imageRendering: "auto" }} />
              )}

              {/* Spine strip on front face */}
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: 18,
                background: "linear-gradient(to right, #111, #2a2a2a 40%, #111)",
                zIndex: 2,
              }} />

              {/* Clear plastic sheen — always on top of cover */}
              <div style={{ position: "absolute", left: 18, top: 0, right: 0, bottom: 0, zIndex: 3, pointerEvents: "none" }}>
                {/* Main plastic tint */}
                {!coverImage && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(238,238,242,0.4) 50%, rgba(200,200,210,0.55) 100%)",
                  }} />
                )}
                {/* Diagonal glare streak — the classic plastic reflection */}
                <div style={{
                  position: "absolute",
                  top: "-10%", left: "-5%",
                  width: "60%", height: "130%",
                  background: "linear-gradient(105deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.18) 45%, rgba(255,255,255,0.0) 50%)",
                  transform: "skewX(-10deg)",
                  pointerEvents: "none",
                }} />
                {/* Top-left bright corner glare */}
                <div style={{
                  position: "absolute", top: 0, left: 0, width: "70%", height: "45%",
                  background: "radial-gradient(ellipse at 15% 10%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.0) 65%)",
                }} />
                {/* Bottom-right subtle reflection */}
                <div style={{
                  position: "absolute", bottom: 0, right: 0, width: "50%", height: "35%",
                  background: "radial-gradient(ellipse at 85% 90%, rgba(255,255,255,0.2) 0%, transparent 70%)",
                }} />
                {/* Thin inner border — plastic edge detail */}
                <div style={{
                  position: "absolute", inset: 0,
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35), inset 0 0 0 2px rgba(0,0,0,0.04)",
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
                fontSize: 15, color: isDark ? "#fff" : "#555", cursor: "pointer",
                letterSpacing: 0.3, borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.5)" : "#999"}`, paddingBottom: 2,
                marginTop: 40,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = isDark ? "#fff" : "#333")}
              onMouseLeave={(e) => (e.currentTarget.style.color = isDark ? "#fff" : "#555")}
            >
              {t.clickToOpen}
            </p>
          )}
        </div>
        </>
      )}

      {/* songs 4u <3 logo — mobile only, fixed top left, always visible */}
      <p className="mobile-only-logo" style={{
        position: "fixed", top: 24, left: 28,
        fontFamily: "'BitcountGrid', monospace",
        fontSize: 20,
        color: isDark ? "#ffffff" : "#111111",
        margin: 0,
        zIndex: 20,
      }}>
        songs 4u &lt;3
      </p>
      <style>{`.mobile-only-logo { display: none; } @media (max-width: 600px) { .mobile-only-logo { display: block; } }`}</style>

      {/* ── OPEN: two-panel layout ── */}
      {(phase === "open" || phase === "closing") && (
        <>
          {phase === "open" && <HeartParticles color={bgColor ? darkenHex(bgColor) : undefined} type={particles} />}


          <div style={{
            perspective: "1200px",
            animation: phase === "closing"
              ? "caseFoldClose 0.42s ease-in forwards"
              : "caseUnfold 0.45s ease-out forwards",
          }}>
            {/* ── OPEN CASE MOCKUP — click to close ── */}
            <div
              ref={openCaseRef}
              className="open-case-container"
              onClick={() => { setPhase("closing"); setTimeout(() => setPhase("closed"), 420); }}
              title="Click to close"
              style={{
              display: "flex",
              maxWidth: "95vw",
              boxShadow: "0 16px 48px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.15)",
              borderRadius: 3,
              border: "1.5px solid rgba(180,180,190,0.45)",
              cursor: "pointer",
              overflow: "hidden",
            }}>

              {/* ── LEFT: Liner notes panel (hidden on mobile) ── */}
              <div className="case-liner-panel" style={{
                width: PW, height: H,
                background: "linear-gradient(160deg, #f8f8f8 0%, #efefef 100%)",
                position: "relative",
                borderRight: "1px solid #ddd",
                overflow: "visible",
              }}>
                {/* Corner clips — sitting ON the edge (half inside, half outside) */}
                {[
                  { top: -10, left: 28 }, { top: -10, right: 28 },
                  { bottom: -10, left: 28 }, { bottom: -10, right: 28 },
                ].map((pos, i) => (
                  <div key={i} style={{
                    position: "absolute", ...pos,
                    width: 20, height: 20, borderRadius: "50%",
                    background: "linear-gradient(135deg, #e0e0e2, #f0f0f2)",
                    border: "1px solid #bbb",
                    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.15), 0 1px 0 rgba(255,255,255,0.9)",
                    zIndex: 4,
                  }} />
                ))}

                {/* Message — letter style */}
                <div style={{
                  position: "absolute", inset: 0,
                  padding: "58px 80px 72px 28px",
                  display: "flex", alignItems: "center", justifyContent: "flex-start",
                  overflow: "hidden",
                }}>
                  {/* Stickers — fixed positions with slight rotation */}
                  {[
                    { bottom: "12%", right: "8%",  rotate: "12deg"  },
                    { bottom: "8%",  left:  "8%",  rotate: "-10deg" },
                    { top:    "8%",  right: "8%",  rotate: "-8deg"  },
                    { top:    "8%",  left:  "8%",  rotate: "10deg"  },
                    { top:   "42%",  right: "6%",  rotate: "15deg"  },
                    { bottom: "4%",  left:  "42%", rotate: "-8deg"  },
                    { top:    "4%",  left:  "42%", rotate: "6deg"   },
                  ].map((pos, i) => stickers[i] ? (
                    <span key={i} style={{
                      position: "absolute",
                      bottom: (pos as {bottom?: string}).bottom, top: (pos as {top?: string}).top,
                      right: (pos as {right?: string}).right, left: (pos as {left?: string}).left,
                      fontSize: 36, lineHeight: 1,
                      pointerEvents: "none", userSelect: "none",
                      opacity: 0.85, width: 44, height: 44,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transform: `rotate(${pos.rotate})`,
                    }}>
                      {stickers[i].startsWith("/") ? (
                        <img src={stickers[i]} alt="sticker" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : stickers[i]}
                    </span>
                  ) : null)}
                  <p style={{
                    fontFamily: "'OrdinaryLetter', cursive",
                    fontSize: 23, color: "rgba(20,20,50,0.82)",
                    margin: 0, lineHeight: 1.5,
                    wordBreak: "break-word",
                    textAlign: "left",
                    WebkitTextStroke: "0.6px rgba(255,255,255,0.55)",
                  }}>
                    {message || <span style={{ opacity: 0.3 }}>...</span>}
                  </p>
                </div>
              </div>

              {/* ── CENTER HINGE (hidden on mobile) ── */}
              <div className="case-hinge" style={{
                width: 10, height: H, flexShrink: 0,
                background: "linear-gradient(to right, #1a1a1a, #3a3a3a 50%, #1a1a1a)",
              }} />

              {/* ── RIGHT: CD tray ── */}
              <div className="cd-tray-panel" style={{
                width: PW, height: H,
                background: "linear-gradient(160deg, #3a3a3c 0%, #252527 100%)",
                position: "relative",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                overflow: "visible",
              }}>
                {/* Edge clips — same as left panel */}
                {[
                  { top: -10, left: 28 }, { top: -10, right: 28 },
                  { bottom: -10, left: 28 }, { bottom: -10, right: 28 },
                ].map((pos, i) => (
                  <div key={`clip-${i}`} style={{
                    position: "absolute", ...pos,
                    width: 20, height: 20, borderRadius: "50%",
                    background: "linear-gradient(135deg, #3a3a3c, #505052)",
                    border: "1px solid #222",
                    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06)",
                    zIndex: 4,
                  }} />
                ))}

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
                  animation: spinState === "playing"
                    ? "cd-spin 4s linear infinite"
                    : spinState === "stopping"
                    ? "cd-spin-slow 2.5s ease-out forwards"
                    : undefined,
                  flexShrink: 0,
                  boxShadow: "0 2px 18px rgba(0,0,0,0.35), 0 0 0 2px rgba(100,100,120,0.55)",
                  // CD-R style: white top to gray bottom gradient
                  background: `
                    linear-gradient(to bottom, #ffffff 0%, #c8c8d4 100%)
                  `,
                }}>
                  {/* Outer rim */}
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    boxShadow: "inset 0 0 0 4px rgba(80,80,110,0.45), inset 0 0 18px rgba(0,0,0,0.08)",
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
                      background: "#272729",
                      boxShadow: "inset 0 2px 5px rgba(0,0,0,0.6)",
                    }} />
                  </div>

                  {/* Message written ON the disc — SVG circular text */}
                  <svg
                    viewBox="0 0 100 100"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 3, overflow: "visible" }}
                  >
                    <defs>
                      {/* Message arcs — 270° spans, inner + outer for 2-line support */}
                      {/* 270° arcs on top half — line1 outer (higher), line2 inner (lower) */}
                      <path id="cdArcMsg1" d="M 29,73 A 29,29 0 1 1 71,73" />
                      <path id="cdArcMsg2" d="M 22,81 A 40,40 0 1 1 78,81" />
                      {/* Bottom arcs */}
                      <path id="cdArcBot1" d="M 21,50 A 29,29 0 0 0 79,50" />
                      <path id="cdArcBot2" d="M 10,50 A 40,40 0 0 0 90,50" />
                    </defs>

                    {/* CD-R label */}
                    <text x="11" y="53" fontFamily="'Raleway', sans-serif" fontSize="6" fontWeight="700" fill="#f06292" letterSpacing="0.3" opacity="0.5" dominantBaseline="middle">CD-R</text>
                    {/* songs 4u <3 logo — right side */}
                    <text x="93" y="53" fontFamily="'BitcountGrid', monospace" fontSize="3" fontWeight="700" fill="rgba(130,130,140,0.70)" textAnchor="end" letterSpacing="0.2" dominantBaseline="middle">songs 4u &lt;3</text>

                    {/* Title — 1 or 2 lines over the top of the CD */}
                    {title && (() => {
                      // Always split into two lines at nearest word boundary to midpoint
                      const words = title.split(" ");
                      const mid = title.length / 2;
                      let splitIdx = 1, best = Infinity;
                      let pos = 0;
                      words.forEach((w, i) => {
                        pos += (i > 0 ? 1 : 0) + w.length;
                        const dist = Math.abs(pos - mid);
                        if (dist < best && i < words.length - 1) { best = dist; splitIdx = i + 1; }
                      });
                      const line1 = words.slice(0, splitIdx).join(" ");
                      const line2 = words.slice(splitIdx).join(" ") || "";
                      return (
                        <>
                          <text fontFamily="'OrdinaryLetter', cursive" fontSize="10.5" fill="rgba(15,20,50,0.72)" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4" paintOrder="stroke fill" textAnchor="middle">
                            <textPath href="#cdArcMsg2" startOffset="50%">{line1}</textPath>
                          </text>
                          {line2 && (
                            <text fontFamily="'OrdinaryLetter', cursive" fontSize="10.5" fill="rgba(15,20,50,0.65)" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4" paintOrder="stroke fill" textAnchor="middle">
                              <textPath href="#cdArcMsg1" startOffset="50%">{line2}</textPath>
                            </text>
                          )}
                        </>
                      );
                    })()}


                    {/* From — bottom inner */}
                    <text fontFamily="'OrdinaryLetter', cursive" fontSize="9.5" fill="rgba(15,20,50,0.78)" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4" paintOrder="stroke fill" textAnchor="middle">
                      <textPath href="#cdArcBot1" startOffset="50%">{lang === "pt" ? "de:" : "from:"} {to}</textPath>
                    </text>

                    {/* To — bottom outer */}
                    {from && (
                      <text fontFamily="'OrdinaryLetter', cursive" fontSize="9" fill="rgba(15,20,50,0.65)" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4" paintOrder="stroke fill" textAnchor="middle">
                        <textPath href="#cdArcBot2" startOffset="50%">{lang === "pt" ? "para:" : "to:"} {from}</textPath>
                      </text>
                    )}

                  </svg>

                </div>
              </div>
            </div>
          </div>{/* end animation wrapper */}

          {/* Player — aligned with CD tray width, less rounded */}
          <style>{`@media (max-width: 600px) { .player-bar { max-width: ${PW}px !important; } }`}</style>

          <div
            className="player-bar"
            onClick={e => e.stopPropagation()}
            style={{
            width: "95vw", maxWidth: W,
            background: "white", borderRadius: 6,
            padding: "12px 16px",
            display: "flex", alignItems: "center", gap: 12,
            boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
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
            {/* Prev — hidden on mobile */}
            <style>{`@media (max-width: 600px) { .player-prev-btn { display: none !important; } }`}</style>
            {total > 1 && (
              <button
                className="player-prev-btn"
                onClick={onPrev}
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(0,0,0,0.1)",
                  cursor: "pointer", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "transform 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 3.5L6 8L12 12.5V3.5Z" fill="#333"/>
                  <rect x="3" y="3.5" width="2" height="9" rx="1" fill="#333"/>
                </svg>
              </button>
            )}

            {/* Play / Pause */}
            <button
              onClick={onTogglePlay}
              disabled={!ready}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: ready ? (bgColor || "#888") : "#ddd",
                border: "none",
                cursor: ready ? "pointer" : "not-allowed",
                flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "transform 0.15s",
              }}
              onMouseEnter={(e) => { if (ready) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
            >
              {isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill={isDark ? "white" : "#111"}><rect x="3" y="2" width="4" height="12" rx="1.5"/><rect x="9" y="2" width="4" height="12" rx="1.5"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill={isDark ? "white" : "#111"}><path d="M5 3.5L13 8L5 12.5V3.5Z"/></svg>
              )}
            </button>

            {/* Next */}
            {total > 1 && (
              <button
                onClick={onNext}
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(0,0,0,0.1)",
                  cursor: "pointer", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "transform 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 3.5L10 8L4 12.5V3.5Z" fill="#333"/>
                  <rect x="11" y="3.5" width="2" height="9" rx="1" fill="#333"/>
                </svg>
              </button>
            )}
          </div>

          {/* Share to Instagram Story button */}
          {playlistId && (
            <button
              onClick={async e => {
                e.stopPropagation();
                if (openCaseRef.current) {
                  try {
                    // Pause CD spin for capture
                    const spinningEls = openCaseRef.current.querySelectorAll<HTMLElement>("[style*='cd-spin']");
                    const savedAnimations: string[] = [];
                    spinningEls.forEach(el => {
                      savedAnimations.push(el.style.animation);
                      el.style.animation = "none";
                      el.style.transform = "rotate(0deg)";
                    });

                    const { toPng } = await import("html-to-image");
                    const dataUrl = await toPng(openCaseRef.current, {
                      pixelRatio: 3,
                      skipFonts: false,
                    });

                    // Restore animations
                    spinningEls.forEach((el, i) => {
                      el.style.animation = savedAnimations[i];
                    });

                    setCapturedImage(dataUrl);
                  } catch {
                    setCapturedImage(null);
                  }
                }
                setShowStory(true);
                track("story_shared", { lang });
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "9px 18px",
                background: "transparent",
                color: isDark ? "#fff" : "#111",
                border: `1.5px solid ${isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.25)"}`,
                borderRadius: 24,
                fontFamily: "system-ui", fontSize: 13, fontWeight: 600,
                cursor: "pointer",
                animation: "fadeUp 0.4s ease 0.45s both",
                marginTop: 32,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={isDark ? "white" : "#111"}>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              {t.shareToStory}
            </button>
          )}

          {/* Story card modal */}
          {showStory && playlistId && (
            <StoryCard
              to={to}
              from={from}
              title={title}
              message={message}
              songs={songs}
              bgColor={bgColor}
              coverImage={coverImage}
              capturedImage={capturedImage ?? undefined}
              particles={particles}
              lang={lang}
              onClose={() => { setShowStory(false); setCapturedImage(null); }}
            />
          )}

          <div style={{
            fontFamily: "'Raleway', system-ui", fontSize: 11, color: isDark ? "rgba(255,255,255,0.75)" : "#555",
            position: "fixed", bottom: 16, left: 0, right: 0, zIndex: 10,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "0 20px", boxSizing: "border-box",
          }}>
            {/* Line 1: made with + caahmills */}
            <span style={{ whiteSpace: "nowrap" }}>
              {t.madeWith}{" "}
              <a href="https://www.instagram.com/caahmills/" target="_blank" rel="noopener noreferrer"
                style={{ color: isDark ? "rgba(255,255,255,0.9)" : "#444", textDecoration: "none", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.4)" : "#aaa"}` }}>
                caahmills
              </a>
            </span>
            {/* Line 2: create playlist + Powered by Deezer */}
            <span style={{ whiteSpace: "nowrap" }}>
              <a href="/" style={{ color: isDark ? "rgba(255,255,255,0.75)" : "#555", textDecoration: "none" }}>
                {lang === "pt" ? <>Crie sua playlist <span style={{ textDecoration: "underline" }}>aqui</span></> : <>Create your playlist <span style={{ textDecoration: "underline" }}>here</span></>}
              </a>
              <span style={{ margin: "0 8px", opacity: 0.4 }}>·</span>
              <a href="https://www.deezer.com" target="_blank" rel="noopener noreferrer" style={{ color: isDark ? "rgba(255,255,255,0.75)" : "#555", textDecoration: "none" }}>Powered by <span style={{ textDecoration: "underline" }}>Deezer</span></a>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
