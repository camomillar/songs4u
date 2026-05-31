"use client";
import { useEffect, useRef } from "react";

interface Song { title: string; artist: string; }
interface Props {
  to: string; from: string; message?: string;
  songs: Song[]; bgColor?: string; coverImage?: string;
  capturedImage?: string;
  particles?: "hearts" | "stars" | "notes" | "none";
  onClose: () => void;
}

function isDark(hex: string) {
  const h = (hex || "#ffffff").replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function darkenOrLighten(hex: string, amount: number): string {
  const h = (hex || "#ffffff").replace("#", "");
  const r = Math.min(255, Math.max(0, parseInt(h.slice(0, 2), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(h.slice(2, 4), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(h.slice(4, 6), 16) + amount));
  return `rgb(${r},${g},${b})`;
}

// Draw arc text along a circle (same as JewelCase)
function drawArcText(
  ctx: CanvasRenderingContext2D, text: string,
  cx: number, cy: number, radius: number,
  centerAngle: number, clockwise: boolean
) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const dir = clockwise ? 1 : -1;
  const totalAngle = [...text].reduce((acc, ch) => acc + ctx.measureText(ch).width / radius, 0);
  let angle = centerAngle - (totalAngle / 2) * dir;
  for (const ch of text) {
    const charAngle = ctx.measureText(ch).width / radius;
    angle += (charAngle / 2) * dir;
    ctx.save();
    ctx.translate(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    ctx.rotate(angle + (clockwise ? Math.PI / 2 : -Math.PI / 2));
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    angle += (charAngle / 2) * dir;
  }
  ctx.restore();
}

function drawCD(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number,
  to: string, from: string, message?: string
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  const base = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  base.addColorStop(0, "#f8f8fa");
  base.addColorStop(0.25, "#ececf0");
  base.addColorStop(0.55, "#d8d8e0");
  base.addColorStop(0.8, "#c8c8d4");
  base.addColorStop(1, "#b8b8c8");
  ctx.fillStyle = base;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

  const conic = ctx.createConicGradient((20 * Math.PI) / 180, cx, cy);
  conic.addColorStop(0, "rgba(150,200,255,0.55)");
  conic.addColorStop(45 / 360, "rgba(150,255,180,0.40)");
  conic.addColorStop(90 / 360, "rgba(255,150,200,0.50)");
  conic.addColorStop(135 / 360, "rgba(200,150,255,0.45)");
  conic.addColorStop(180 / 360, "rgba(150,240,255,0.50)");
  conic.addColorStop(225 / 360, "rgba(255,230,120,0.40)");
  conic.addColorStop(270 / 360, "rgba(255,160,130,0.45)");
  conic.addColorStop(1, "rgba(150,200,255,0.55)");
  ctx.fillStyle = conic;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

  const hl = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.35, 0, cx, cy, radius);
  hl.addColorStop(0, "rgba(255,255,255,0.70)");
  hl.addColorStop(0.4, "rgba(255,255,255,0.00)");
  ctx.fillStyle = hl;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

  ctx.restore();

  for (const pct of [0.36, 0.50, 0.64, 0.78]) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius * pct, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(150,150,165,0.12)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius - 1.5, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(180,180,195,0.5)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(200,215,230,0.90)";
  ctx.fill();
  ctx.strokeStyle = "rgba(150,165,190,0.6)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.074, 0, Math.PI * 2);
  ctx.fillStyle = "#f5f5f6";
  ctx.fill();

  ctx.font = `italic ${Math.round(radius * 0.115)}px Georgia, serif`;
  ctx.fillStyle = "rgba(15,20,50,0.78)";
  drawArcText(ctx, `to: ${to}`, cx, cy, radius * 0.58, Math.PI / 2, false);

  if (from) {
    ctx.font = `italic ${Math.round(radius * 0.10)}px Georgia, serif`;
    ctx.fillStyle = "rgba(15,20,50,0.65)";
    drawArcText(ctx, `from: ${from}`, cx, cy, radius * 0.74, Math.PI / 2, false);
  }

  if (message) {
    const words = message.split(" ");
    const mid = message.length / 2;
    let splitIdx = 0, best = Infinity, pos = 0;
    words.forEach((w, i) => {
      pos += (i > 0 ? 1 : 0) + w.length;
      const dist = Math.abs(pos - mid);
      if (dist < best) { best = dist; splitIdx = i + 1; }
    });
    ctx.font = `italic ${Math.round(radius * 0.10)}px Georgia, serif`;
    ctx.fillStyle = "rgba(15,20,50,0.72)";
    if (words.length <= 1 || message.length <= 14) {
      drawArcText(ctx, message, cx, cy, radius * 0.55, -Math.PI / 2, true);
    } else {
      drawArcText(ctx, words.slice(0, splitIdx).join(" "), cx, cy, radius * 0.70, -Math.PI / 2, true);
      ctx.fillStyle = "rgba(15,20,50,0.65)";
      drawArcText(ctx, words.slice(splitIdx).join(" "), cx, cy, radius * 0.52, -Math.PI / 2, true);
    }
  }
}

async function generateStory(canvas: HTMLCanvasElement, props: Omit<Props, "onClose">) {
  const { to, from, message, songs, bgColor = "#c8b4e8", coverImage, capturedImage, particles = "hearts" } = props;
  const W = 1080, H = 1920;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const dark = isDark(bgColor);
  const fg = dark ? "rgba(255,255,255,0.92)" : "rgba(15,15,35,0.88)";
  const fgSub = dark ? "rgba(255,255,255,0.45)" : "rgba(15,15,35,0.40)";
  const starColor = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";

  // Load fonts
  try {
    const font = new FontFace("Raleway", "url(/fonts/Raleway-VariableFont_wght.ttf)");
    await font.load();
    document.fonts.add(font);
  } catch { /* fallback */ }
  try {
    const font = new FontFace("BitcountGrid", "url(/fonts/BitcountGridSingle-VariableFont_CRSV,ELSH,ELXP,slnt,wght.ttf)");
    await font.load(); document.fonts.add(font);
  } catch { /* fallback */ }
  try {
    const font = new FontFace("RosieBrown", "url(/fonts/Rosie Brown Serif Demo.otf)");
    await font.load();
    document.fonts.add(font);
  } catch { /* fallback */ }

  // ── Background ──
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);

  // ── Scattered particles (user's chosen type) ──
  const PARTICLE_CHARS: Record<string, string[]> = {
    hearts: ["♥", "♡", "♥", "✦", "♥"],
    stars:  ["✦", "✧", "★", "✩", "✦"],
    notes:   ["♪", "♫", "♩", "♬", "♪"],
    flowers: ["✿", "❀", "✾", "✿", "❁"],
    kisses: ["✕", "♡", "✕", "✦", "✕"],
    none:    [],
  };
  const particleSet = PARTICLE_CHARS[particles] || [];
  if (particleSet.length > 0) {
    const positions = [
      { x: 0.06, y: 0.60, s: 38 }, { x: 0.91, y: 0.50, s: 30 },
      { x: 0.87, y: 0.67, s: 46 }, { x: 0.94, y: 0.77, s: 24 },
      { x: 0.05, y: 0.79, s: 34 }, { x: 0.14, y: 0.91, s: 26 },
      { x: 0.83, y: 0.91, s: 38 }, { x: 0.50, y: 0.95, s: 22 },
      { x: 0.95, y: 0.41, s: 20 }, { x: 0.03, y: 0.47, s: 28 },
      { x: 0.78, y: 0.58, s: 18 }, { x: 0.20, y: 0.70, s: 22 },
    ];
    ctx.save();
    ctx.fillStyle = starColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    positions.forEach(({ x, y, s }, i) => {
      ctx.font = `${s * 2.5}px system-ui`;
      ctx.globalAlpha = 0.9;
      ctx.fillText(particleSet[i % particleSet.length], x * W, y * H);
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Layout constants
  const panelSize = 540;
  const cdRadius = panelSize / 2;
  const totalWidth = panelSize + cdRadius * 0.4 + cdRadius;
  const panelX = (W - totalWidth) / 2;

  // ── "songs4u <3" branding — aligned with cover case ──
  ctx.font = `700 64px BitcountGrid, "Courier New", monospace`;
  ctx.fillStyle = fg;
  ctx.textAlign = "left";
  ctx.fillText("songs4u <3", panelX, 320);
  const panelY = 420;
  const spineW = 22;
  const cdCx = panelX + panelSize + cdRadius * 0.4;
  const cdCy = panelY + panelSize / 2 + 10;

  // ── 1. CD disc drawn FIRST (behind cover) ──
  if (capturedImage) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const srcX = Math.floor(img.width * 0.507);
        const srcW = img.width - srcX;
        const srcH = img.height;
        const discRadiusSrc = srcH * 0.42;
        const discCxSrc = srcX + srcW * 0.5;
        const discCySrc = srcH * 0.5;
        const drawSize = cdRadius * 2;

        // Shadow
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.25)";
        ctx.shadowBlur = 70;
        ctx.shadowOffsetX = 12;
        ctx.shadowOffsetY = 16;
        ctx.beginPath();
        ctx.arc(cdCx, cdCy, cdRadius, 0, Math.PI * 2);
        ctx.fillStyle = bgColor;
        ctx.fill();
        ctx.restore();

        // Clip circle and draw disc
        ctx.save();
        ctx.beginPath();
        ctx.arc(cdCx, cdCy, cdRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(
          img,
          discCxSrc - discRadiusSrc, discCySrc - discRadiusSrc,
          discRadiusSrc * 2, discRadiusSrc * 2,
          cdCx - cdRadius, cdCy - cdRadius, drawSize, drawSize
        );
        ctx.restore();

        // Paint hole with bgColor
        ctx.beginPath();
        ctx.arc(cdCx, cdCy, cdRadius * 0.16, 0, Math.PI * 2);
        ctx.fillStyle = bgColor;
        ctx.fill();

        resolve();
      };
      img.onerror = () => resolve();
      img.src = capturedImage;
    });
  } else {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 70;
    ctx.shadowOffsetX = 12;
    ctx.shadowOffsetY = 16;
    ctx.beginPath();
    ctx.arc(cdCx, cdCy, cdRadius, 0, Math.PI * 2);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.restore();
    drawCD(ctx, cdCx, cdCy, cdRadius, to, from, message);
    ctx.beginPath();
    ctx.arc(cdCx, cdCy, cdRadius * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = bgColor;
    ctx.fill();
  }

  // ── 2. Cover panel drawn ON TOP of CD ──
  // Drop shadow — fill with bgColor so shadow renders but fill is invisible
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetX = 12;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = bgColor;
  ctx.fillRect(panelX, panelY, panelSize, panelSize);
  ctx.restore();

  ctx.fillStyle = "#111";
  ctx.fillRect(panelX, panelY, spineW, panelSize);

  if (coverImage) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(panelX + spineW, panelY, panelSize - spineW, panelSize);
    ctx.clip();
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, panelX + spineW, panelY, panelSize - spineW, panelSize);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = coverImage;
    });
    ctx.restore();
  } else {
    ctx.fillStyle = "#dcdcde";
    ctx.fillRect(panelX + spineW, panelY, panelSize - spineW, panelSize);
  }

  // Plastic glare
  ctx.save();
  ctx.beginPath();
  ctx.rect(panelX + spineW, panelY, panelSize - spineW, panelSize);
  ctx.clip();
  const glare = ctx.createLinearGradient(panelX + spineW, panelY, panelX + panelSize * 0.7, panelY + panelSize * 0.6);
  glare.addColorStop(0, "rgba(255,255,255,0.28)");
  glare.addColorStop(0.4, "rgba(255,255,255,0.06)");
  glare.addColorStop(1, "rgba(255,255,255,0.0)");
  ctx.fillStyle = glare;
  ctx.fillRect(panelX + spineW, panelY, panelSize - spineW, panelSize);
  ctx.restore();

  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelSize, panelSize);

  // ── Headphones PNG — drawn last so it's on top ──
  await new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const size = 580;
      ctx.drawImage(img, W - size + 120, 60, size, size);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = "/headphones2.png";
  });

  // ── Song list ──
  const listY = panelY + panelSize + 90;
  const maxSongs = Math.min(songs.length, 7);
  ctx.textAlign = "left";

  for (let i = 0; i < maxSongs; i++) {
    const s = songs[i];
    const y = listY + i * 68;
    const line = `${i + 1}. ${s.title} — ${s.artist}`;
    ctx.font = `500 36px Raleway, system-ui`;
    ctx.fillStyle = dark ? "rgba(255,255,255,0.92)" : "rgba(15,15,35,0.85)";
    let text = line;
    while (ctx.measureText(text).width > W - 140 && text.length > 4) text = text.slice(0, -1);
    if (text !== line) text += "...";
    ctx.fillText(text, 72, y);
  }

  if (songs.length > maxSongs) {
    ctx.font = `italic 32px Raleway, system-ui`;
    ctx.fillStyle = dark ? "rgba(255,255,255,0.55)" : "rgba(15,15,35,0.45)";
    ctx.fillText(`+ ${songs.length - maxSongs} more songs`, 72, listY + maxSongs * 68 + 10);
  }

  // ── Bottom CTA ──
  ctx.textAlign = "center";
  const ctaSub = dark ? "rgba(255,255,255,0.80)" : "rgba(15,15,35,0.40)";
  const ctaMain = dark ? "#ffffff" : "rgba(15,15,35,0.88)";
  ctx.font = `400 30px Raleway, system-ui`;
  ctx.fillStyle = ctaSub;
  ctx.fillText("Create your playlist", W / 2, H - 160);
  ctx.font = `700 38px Raleway, system-ui`;
  ctx.fillStyle = ctaMain;
  ctx.fillText("songs4u.online", W / 2, H - 110);
}

export default function StoryCard(props: Props) {
  const { onClose } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const offscreen = document.createElement("canvas");
    generateStory(offscreen, props).then(() => {
      if (previewRef.current) {
        const scale = Math.min((window.innerWidth - 48) / 1080, (window.innerHeight - 160) / 1920);
        previewRef.current.width = Math.round(1080 * scale);
        previewRef.current.height = Math.round(1920 * scale);
        previewRef.current.getContext("2d")!.drawImage(offscreen, 0, 0, previewRef.current.width, previewRef.current.height);
      }
      if (canvasRef.current) {
        canvasRef.current.width = offscreen.width;
        canvasRef.current.height = offscreen.height;
        canvasRef.current.getContext("2d")!.drawImage(offscreen, 0, 0);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `songs4u-${props.to.replace(/\s+/g, "-")}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.82)", backdropFilter: "blur(10px)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      zIndex: 300, padding: 16, gap: 16,
    }}>
      <canvas ref={previewRef} onClick={e => e.stopPropagation()}
        style={{ borderRadius: 20, boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div onClick={e => e.stopPropagation()} style={{ display: "flex", gap: 10 }}>
        <button onClick={handleDownload} style={{
          padding: "12px 28px",
          background: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
          color: "white", border: "none", borderRadius: 24,
          fontFamily: "system-ui", fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}>⬇ Save Image</button>
        <button onClick={onClose} style={{
          padding: "12px 20px", background: "rgba(255,255,255,0.15)",
          color: "white", border: "none", borderRadius: 24,
          fontFamily: "system-ui", fontSize: 14, cursor: "pointer",
        }}>Close</button>
      </div>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "system-ui" }}>
        Save and upload to your Instagram Story
      </p>
    </div>
  );
}
