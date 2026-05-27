"use client";
import { useState } from "react";
import Image from "next/image";

interface Props {
  url: string;
  onClose: () => void;
}

export default function QRShare({ url, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=3d0015&bgcolor=fff8fb&data=${encodeURIComponent(url)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <p style={{ fontSize: 11, marginBottom: 20, color: "var(--accent2)" }}>
          ♥ Share your playlist ♥
        </p>

        <Image
          src={qrSrc}
          alt="QR Code"
          width={200}
          height={200}
          className="album-art"
          style={{ margin: "0 auto 20px", display: "block", imageRendering: "pixelated" }}
          unoptimized
        />

        <p style={{ fontSize: 7, color: "var(--text2)", marginBottom: 12, lineHeight: 2 }}>
          Scan or copy the link below:
        </p>

        <div
          style={{
            background: "var(--bg2)",
            border: "2px solid var(--text)",
            padding: "8px 10px",
            fontSize: 6,
            wordBreak: "break-all",
            color: "var(--text)",
            marginBottom: 14,
            lineHeight: 2,
            textAlign: "left",
          }}
        >
          {url}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button className="pixel-btn" style={{ flex: 1 }} onClick={handleCopy}>
            {copied ? "✓ Copied!" : "Copy Link"}
          </button>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
            <button className="pixel-btn green" style={{ width: "100%" }}>
              Open ↗
            </button>
          </a>
        </div>
        <button className="pixel-btn ghost" style={{ width: "100%" }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
