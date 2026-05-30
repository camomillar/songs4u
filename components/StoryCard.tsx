"use client";
import { useEffect, useRef } from "react";

interface Song { title: string; artist: string; }
interface Props {
  to: string; from: string; message?: string;
  songs: Song[]; bgColor?: string; coverImage?: string;
  capturedImage?: string;
  onClose: () => void;
}

function isDark(hex: string) {
  const h = (hex || "#ffffff").replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

async function generateStory(canvas: HTMLCanvasElement, props: Omit<Props, "onClose">) {
  const { bgColor = "#e8edf2", capturedImage, songs } = props;
  const W = 1080, H = 1920;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const dark = isDark(bgColor);
  const fg = dark ? "rgba(255,255,255,0.90)" : "rgba(15,15,30,0.85)";
  const fgSub = dark ? "rgba(255,255,255,0.45)" : "rgba(15,15,30,0.40)";

  // ── Load Raleway font ──
  try {
    const font = new FontFace("Raleway", "url(/Raleway-VariableFont_wght.ttf)");
    await font.load();
    document.fonts.add(font);
  } catch { /* fallback */ }

  // ── Background — user's exact color ──
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);

  // ── Jewel case image at top ──
  let y = 160;
  let listX = 60;
  if (capturedImage) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const cropStartX = Math.floor(img.width * 0.507);
        const cropW = img.width - cropStartX;
        const cropH = img.height;
        const maxW = W - 120;
        const maxH = 740;
        const scale = Math.min(maxW / cropW, maxH / cropH);
        const drawW = cropW * scale;
        const drawH = cropH * scale;
        const drawX = (W - drawW) / 2;
        ctx.drawImage(img, cropStartX, 0, cropW, cropH, drawX, y, drawW, drawH);
        listX = drawX;
        y += drawH + 100;
        resolve();
      };
      img.onerror = () => { y += 740 + 100; resolve(); };
      img.src = capturedImage;
    });
  } else {
    y += 740 + 100;
  }

  // ── Song list ──
  const maxSongs = Math.min(songs.length, 9);
  ctx.textAlign = "left";
  const lineH = 58;

  for (let i = 0; i < maxSongs; i++) {
    const s = songs[i];
    const line = `${i + 1}. ${s.artist} – ${s.title}`;
    ctx.font = `500 36px Raleway, system-ui, sans-serif`;
    ctx.fillStyle = fg;
    let text = line;
    while (ctx.measureText(text).width > W - listX - 40 && text.length > 4) text = text.slice(0, -1);
    if (text !== line) text += "…";
    ctx.fillText(text, listX, y);
    y += lineH;
  }

  if (songs.length > maxSongs) {
    y += 8;
    ctx.font = `italic 34px Raleway, system-ui, sans-serif`;
    ctx.fillStyle = fgSub;
    ctx.fillText(`+${songs.length - maxSongs} more songs`, listX, y);
    y += lineH;
  }

  // ── Bottom CTA ──
  ctx.textAlign = "center";
  ctx.font = `400 30px system-ui, sans-serif`;
  ctx.fillStyle = fgSub;
  ctx.fillText("Create your own playlist on", W / 2, H - 160);
  ctx.font = `700 36px system-ui, sans-serif`;
  ctx.fillStyle = fg;
  ctx.fillText("songs4u.online", W / 2, H - 112);
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
