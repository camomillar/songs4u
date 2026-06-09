import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "linear-gradient(135deg, #d0e4f8 0%, #e8d0f4 40%, #f4e8c0 70%, #c0d8ec 100%)",
        border: "1px solid #b0b0c0",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        {/* CD ring */}
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {/* Center hole */}
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#111",
          }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
