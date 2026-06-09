import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="cd" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#f0f0f8" />
              <stop offset="30%" stopColor="#c8d8f0" />
              <stop offset="55%" stopColor="#e0c8f0" />
              <stop offset="75%" stopColor="#f0e0b0" />
              <stop offset="100%" stopColor="#b0c8e0" />
            </radialGradient>
          </defs>
          {/* CD outer disc */}
          <circle cx="16" cy="16" r="15" fill="url(#cd)" stroke="#b0b0c0" strokeWidth="0.5" />
          {/* CD rings */}
          <circle cx="16" cy="16" r="11" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
          <circle cx="16" cy="16" r="7" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          {/* Heart path in center */}
          <path
            d="M16 20.5 C16 20.5 10.5 16.5 10.5 13 C10.5 10.8 12.3 9.5 14 9.5 C15 9.5 15.7 10 16 10.5 C16.3 10 17 9.5 18 9.5 C19.7 9.5 21.5 10.8 21.5 13 C21.5 16.5 16 20.5 16 20.5Z"
            fill="rgba(0,0,0,0)"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
