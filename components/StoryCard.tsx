"use client";
import { useEffect, useRef } from "react";

interface Song { title: string; artist: string; }
interface Props {
  to: string; from: string; message?: string;
  songs: Song[]; bgColor?: string; coverImage?: string;
  capturedImage?: string;
  particles?: "hearts" | "stars" | "notes" | "flowers" | "none";
  lang?: "en" | "pt";
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
  to: string, from: string, message?: string,
  lang: "en" | "pt" = "pt"
) {
  // ── Iridescent disc surface (matches JewelCase CSS exactly) ──
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  // White top to gray bottom gradient
  const base = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius);
  base.addColorStop(0, "#ffffff");
  base.addColorStop(1, "#c8c8d4");
  ctx.fillStyle = base;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

  ctx.restore();

  // ── Outer rim — stronger stroke like CD-R ──
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(80,80,110,0.50)";
  ctx.lineWidth = 4;
  ctx.stroke();

  // ── Stacking ring (blue-gray hub area, 30% of disc) ──
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.15, 0, Math.PI * 2);
  const stackGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.15);
  stackGrad.addColorStop(0,   "rgba(200,215,230,0.90)");
  stackGrad.addColorStop(0.6, "rgba(180,195,215,0.85)");
  stackGrad.addColorStop(1,   "rgba(160,175,200,0.80)");
  ctx.fillStyle = stackGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(150,165,190,0.6)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // ── Center hole — dark (#272729 matches real CD / JewelCase) ──
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.074, 0, Math.PI * 2);
  ctx.fillStyle = "#272729";
  ctx.fill();

  // ── CD-R label (pink, left side, 50% opacity) ──
  ctx.save();
  ctx.font = `700 ${Math.round(radius * 0.14)}px "Raleway", sans-serif`;
  ctx.fillStyle = "#f06292";
  ctx.globalAlpha = 0.5;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("CD-R", cx - radius * 0.76, cy + radius * 0.06);
  ctx.restore();

  // ── songs 4u <3 logo — right side ──
  ctx.save();
  ctx.font = `700 ${Math.round(radius * 0.07)}px "BitcountGrid", monospace`;
  ctx.fillStyle = "rgba(130,130,140,0.70)";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("songs 4u <3", cx + radius * 0.86, cy + radius * 0.06);
  ctx.restore();

  // ── Text arcs — OrdinaryLetter font, same as JewelCase SVG ──
  // Proportions derived from JewelCase viewBox 0 0 100 100, CD radius=50:
  //   fontSize / 50 * canvas_radius
  //   arc_radius / 50 * canvas_radius
  const font = `"OrdinaryLetter", cursive`;
  const toLabel   = lang === "pt" ? "para:" : "to:";
  const fromLabel = lang === "pt" ? "de:"   : "from:";

  // Message — top arcs (270° spans): line1 outer r=0.76R, line2 inner r=0.58R
  // fontSize 7.5 → 7.5/50 = 0.15R
  if (message && message.trim()) {
    const words = message.trim().split(" ");
    const mid = message.length / 2;
    let splitIdx = 1, best = Infinity, pos = 0;
    words.forEach((w, i) => {
      pos += (i > 0 ? 1 : 0) + w.length;
      const dist = Math.abs(pos - mid);
      if (dist < best && i < words.length - 1) { best = dist; splitIdx = i + 1; }
    });
    const line1 = words.slice(0, splitIdx).join(" ");
    const line2 = words.slice(splitIdx).join(" ") || "";

    ctx.font = `${Math.round(radius * 0.21)}px ${font}`;
    ctx.fillStyle = "rgba(15,20,50,0.72)";
    // line1 on outer arc (r=0.76R)
    drawArcText(ctx, line1, cx, cy, radius * 0.80, -Math.PI / 2 + 0.06, true);
    if (line2) {
      ctx.fillStyle = "rgba(15,20,50,0.65)";
      // line2 on inner arc (r=0.58R)
      drawArcText(ctx, line2, cx, cy, radius * 0.58, -Math.PI / 2 + 0.06, true);
    }
  }

  // From (de:) — inner bottom arc, r=0.58R, fontSize 12/50 = 0.24R
  // Note: in ValentinesPlaylist, `to` holds sender's name, `from` holds recipient's
  ctx.font = `${Math.round(radius * 0.19)}px ${font}`;
  ctx.fillStyle = "rgba(15,20,50,0.78)";
  drawArcText(ctx, `${fromLabel} ${to}`, cx, cy, radius * 0.58, Math.PI / 2, false);

  // To (para:) — outer bottom arc, r=0.80R, fontSize 11.5/50 = 0.23R
  if (from) {
    ctx.font = `${Math.round(radius * 0.18)}px ${font}`;
    ctx.fillStyle = "rgba(15,20,50,0.65)";
    drawArcText(ctx, `${toLabel} ${from}`, cx, cy, radius * 0.80, Math.PI / 2, false);
  }
}

async function generateStory(canvas: HTMLCanvasElement, props: Omit<Props, "onClose">) {
  const { to, from, message, songs, bgColor = "#c8b4e8", coverImage, capturedImage, particles = "hearts", lang = "pt" } = props;
  const ctaLine1 = lang === "pt" ? "Crie sua playlist" : "Create your playlist";
  const ctaLine2 = "songs4u.online";
  const W = 1080, H = 1920;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const dark = isDark(bgColor);
  const fg = dark ? "rgba(255,255,255,0.92)" : "rgba(15,15,35,0.88)";
  const fgSub = dark ? "rgba(255,255,255,0.45)" : "rgba(15,15,35,0.40)";
  // Darken bgColor for particles (same as darkenHex in HeartParticles)
  const darkenColor = (hex: string, amount = 80): string => {
    const h = (hex || "#ffffff").replace("#", "");
    const r = Math.max(0, parseInt(h.slice(0, 2), 16) - amount);
    const g = Math.max(0, parseInt(h.slice(2, 4), 16) - amount);
    const b = Math.max(0, parseInt(h.slice(4, 6), 16) - amount);
    return `rgba(${r},${g},${b},0.30)`;
  };
  const isVeryDark = (() => {
    const h = (bgColor || "#fff").replace("#", "");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 40;
  })();
  const starColor = isVeryDark ? "rgba(80,80,80,0.20)" : darkenColor(bgColor);

  // Load fonts — explicitly wait for each weight needed
  try {
    const fontRegular = new FontFace("Raleway", "url(/fonts/Raleway-VariableFont_wght.ttf)", { weight: "100 900" });
    const loaded = await fontRegular.load();
    document.fonts.add(loaded);
    await document.fonts.ready;
    await document.fonts.load("400 42px Raleway");
    await document.fonts.load("700 42px Raleway");
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
  try {
    const font = new FontFace("OrdinaryLetter", "url(/fonts/ordinary_letter/Ordinary Letter.otf)");
    await font.load();
    document.fonts.add(font);
    await document.fonts.load(`16px OrdinaryLetter`);
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
  const panelSize = 520;
  const cdRadius = panelSize / 2;
  const totalWidth = panelSize + cdRadius * 0.4 + cdRadius;
  const panelX = (W - totalWidth) / 2;

  // ── "songs 4u <3" branding ──
  ctx.font = `700 64px BitcountGrid, "Courier New", monospace`;
  ctx.fillStyle = fg;
  ctx.textAlign = "left";
  ctx.fillText("songs 4u <3", panelX, 220);
  const panelY = 360;
  const spineW = 22;
  const cdCx = panelX + panelSize + cdRadius * 0.4;
  const cdCy = panelY + panelSize / 2 + 10;

  // ── 1. CD disc drawn FIRST (behind cover) — always use canvas drawCD ──
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
  drawCD(ctx, cdCx, cdCy, cdRadius, to, from, message, lang);
  // Center hole — show background colour through the disc
  ctx.beginPath();
  ctx.arc(cdCx, cdCy, cdRadius * 0.10, 0, Math.PI * 2);
  ctx.fillStyle = bgColor;
  ctx.fill();

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

  ctx.strokeStyle = dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.2)";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(panelX, panelY, panelSize, panelSize);

  // ── Headphones PNG — drawn last so it's on top ──
  await new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const size = 580;
      ctx.drawImage(img, W - size + 120, H - size + 120, size, size);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = "/headphones2.png";
  });

  // ── Song list ──
  const listY = panelY + panelSize + 105;
  const listX = panelX + 20;
  const maxSongs = Math.min(songs.length, 10);
  const lineH = 62;
  ctx.textAlign = "left";

  for (let i = 0; i < maxSongs; i++) {
    const s = songs[i];
    const y = listY + i * lineH;
    ctx.fillStyle = dark ? "rgba(255,255,255,0.92)" : "rgba(15,15,35,0.85)";
    const maxWidth = W - listX - 180;

    // Draw number + artist in bold
    const boldPrefix = `${i + 1}. ${s.artist} — `;
    ctx.font = `700 42px Raleway, system-ui`;
    const prefixWidth = ctx.measureText(boldPrefix).width;
    ctx.fillText(boldPrefix, listX, y);

    // Draw song title in regular weight, truncated if needed
    ctx.font = `400 42px Raleway, system-ui`;
    let title = s.title;
    while (ctx.measureText(title).width > maxWidth - prefixWidth && title.length > 2) {
      title = title.slice(0, -1);
    }
    if (title !== s.title) title += "...";
    ctx.fillText(title, listX + prefixWidth, y);
  }

  // ── Wire PNG at bottom ──
  await new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const size = 420;
      ctx.drawImage(img, -40, H - size + 160, size, size);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = "/wire.png";
  });

  // ── Bottom CTA ──
  ctx.textAlign = "left";
  const ctaSub = dark ? "rgba(255,255,255,0.80)" : "rgba(15,15,35,0.40)";
  const ctaMain = dark ? "#ffffff" : "rgba(15,15,35,0.88)";
  ctx.font = `400 33px Raleway, system-ui`;
  ctx.fillStyle = ctaMain;
  ctx.textAlign = "center";
  ctx.fillText("songs4u.online", W / 2, H - 192);
  ctx.textAlign = "left";
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
    const filename = `songs4u-${props.to.replace(/\s+/g, "-")}.png`;

    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;

      // On mobile: use Web Share API so user can save directly to gallery
      if (navigator.share) {
        const file = new File([blob], filename, { type: "image/png" });
        try {
          await navigator.share({ files: [file], title: "songs4u" });
          return;
        } catch {
          // user cancelled or share failed — fall through to download
        }
      }

      // Desktop fallback: regular download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filename;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, "image/png");
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
        }}>Save Image</button>
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
