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
          {/* Heart made of two circles + rotated square */}
          <div style={{ position: "relative", width: 10, height: 10, display: "flex" }}>
            <div style={{
              position: "absolute", width: 10, height: 10,
              background: "#e05080",
              transform: "rotate(45deg)",
              borderRadius: "1px",
              top: 2, left: 0,
            }} />
            <div style={{
              position: "absolute", width: 7, height: 7,
              background: "#e05080", borderRadius: "50%",
              top: 0, left: 0,
            }} />
            <div style={{
              position: "absolute", width: 7, height: 7,
              background: "#e05080", borderRadius: "50%",
              top: 0, left: 3,
            }} />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
