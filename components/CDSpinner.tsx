"use client";
import Image from "next/image";

interface Props {
  isPlaying: boolean;
}

export default function CDSpinner({ isPlaying }: Props) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
      <div
        style={{
          width: 220,
          height: 220,
          borderRadius: "50%",
          overflow: "hidden",
          animation: "cd-spin 4s linear infinite",
          animationPlayState: isPlaying ? "running" : "paused",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          flexShrink: 0,
        }}
      >
        <Image
          src="/cd.png"
          alt="CD"
          width={220}
          height={220}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          priority
        />
      </div>
    </div>
  );
}
