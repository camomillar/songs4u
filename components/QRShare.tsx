"use client";
import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";

const F = "system-ui, -apple-system, sans-serif";

interface Props {
  url: string;
  onClose: () => void;
}

export default function QRShare({ url, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code client-side — no URL length limits
  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 180,
        margin: 1,
        color: { dark: "#111111", light: "#ffffff" },
      });
    }
  }, [url]);


  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200, padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 20,
          padding: 28,
          maxWidth: 480, width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 26, color: "#111", margin: 0, textAlign: "center" }}>
            Share your playlist
          </p>
          <button onClick={onClose} style={{
            position: "absolute", right: 0,
            background: "#f0f0f2", border: "none", borderRadius: "50%",
            width: 32, height: 32, cursor: "pointer", fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#888", flexShrink: 0, lineHeight: 1, padding: 0,
          }}>✕</button>
        </div>

        {/* QR Code — generated client-side */}
        <canvas
          ref={canvasRef}
          style={{ display: "block", margin: "0 auto 20px", borderRadius: 12 }}
        />

        {/* URL preview */}
        <div style={{
          background: "#f7f7f8",
          border: "1px solid #e8e8ea",
          borderRadius: 10,
          padding: "10px 14px",
          fontFamily: F, fontSize: 12,
          color: "#555",
          marginBottom: 16,
          display: "flex", alignItems: "center", gap: 8,
          overflow: "hidden",
        }}>
          <span style={{ color: "#bbb", flexShrink: 0 }}>🔗</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {url.split("?")[0]}<span style={{ color: "#bbb" }}>?d=...</span>
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button
            onClick={handleCopy}
            style={{
              flex: 1, fontFamily: F, fontSize: 14, fontWeight: 600,
              background: copied ? "#1DB954" : "#111", color: "white",
              border: "none", borderRadius: 12, padding: "12px",
              cursor: "pointer", transition: "background 0.2s",
            }}
          >
            {copied ? "✓ Copied!" : "Copy Link"}
          </button>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
            <button style={{
              width: "100%", fontFamily: F, fontSize: 14, fontWeight: 600,
              background: "#f0f0f2", color: "#111",
              border: "none", borderRadius: 12, padding: "12px",
              cursor: "pointer",
            }}>
              Open <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: "middle", marginLeft: 4 }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
