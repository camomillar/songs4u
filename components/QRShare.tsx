"use client";
import { useState } from "react";
import Image from "next/image";

const F = "system-ui, -apple-system, sans-serif";

interface Props {
  url: string;
  onClose: () => void;
}

export default function QRShare({ url, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  const message = `I made something special for you 🎵\n\n${url}`;

  const handleCopyMessage = async () => {
    await navigator.clipboard.writeText(message);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=111111&bgcolor=ffffff&data=${encodeURIComponent(url)}`;

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
        {/* Title */}
        <p style={{ fontFamily: "'OrdinaryLetter', cursive", fontSize: 26, color: "#111", textAlign: "center", margin: "0 0 20px" }}>
          share your playlist ♥
        </p>

        {/* QR Code */}
        <Image
          src={qrSrc}
          alt="QR Code"
          width={180}
          height={180}
          unoptimized
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

        {/* Copy message */}
        <button
          onClick={handleCopyMessage}
          style={{
            width: "100%", fontFamily: F, fontSize: 13,
            background: copiedMsg ? "#f0fdf4" : "#f7f7f8",
            color: copiedMsg ? "#16a34a" : "#555",
            border: `1px solid ${copiedMsg ? "#bbf7d0" : "#e8e8ea"}`,
            borderRadius: 10, padding: "10px 14px",
            cursor: "pointer", marginBottom: 12,
            textAlign: "left",
            transition: "all 0.2s",
          }}
        >
          {copiedMsg ? "✓ Message copied!" : `💬  "I made something special for you 🎵 + link"`}
        </button>

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
              Open ↗
            </button>
          </a>
        </div>
        <button
          onClick={onClose}
          style={{
            width: "100%", fontFamily: F, fontSize: 13,
            background: "none", color: "#aaa",
            border: "none", padding: "8px", cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
