import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{
        width: 32, height: 32,
        background: "white",
        borderRadius: 6,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 18 C10 18 1 12 1 6.5 C1 3.9 3.2 2 5.5 2 C7.1 2 8.4 2.8 9.2 4 C9.6 2.8 10.9 2 12.5 2 C14.8 2 17 3.9 17 6.5 C17 12 10 18 10 18 Z"
            fill="#e05080"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
