import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          {/* CD outer disc — iridescent silver */}
          <defs>
            <radialGradient id="cd" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#f0f0f8" />
              <stop offset="30%" stopColor="#c8d8f0" />
              <stop offset="55%" stopColor="#e0c8f0" />
              <stop offset="75%" stopColor="#f0e0b0" />
              <stop offset="100%" stopColor="#b0c8e0" />
            </radialGradient>
          </defs>
          <circle cx="16" cy="16" r="15" fill="url(#cd)" stroke="#b0b0c0" strokeWidth="0.5" />
          {/* CD rings */}
          <circle cx="16" cy="16" r="11" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
          <circle cx="16" cy="16" r="7" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          {/* Heart in center */}
          <text x="16" y="20" textAnchor="middle" fontSize="9" fill="#e05080">♥</text>
        </svg>
      </div>
    ),
    { ...size }
  );
}
