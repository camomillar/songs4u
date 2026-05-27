"use client";

interface Props {
  isPlaying: boolean;
  toName: string;
}

// Hearts scattered around the disc at (angle, radius%) positions
const HEARTS = [
  { angle: 15,  r: 36, size: 13 },
  { angle: 70,  r: 40, size: 10 },
  { angle: 130, r: 34, size: 14 },
  { angle: 185, r: 38, size: 11 },
  { angle: 240, r: 35, size: 13 },
  { angle: 295, r: 39, size: 10 },
  { angle: 340, r: 33, size: 12 },
];

function heartStyle(angle: number, r: number, size: number): React.CSSProperties {
  const rad = (angle * Math.PI) / 180;
  const x = 50 + r * Math.cos(rad);
  const y = 50 - r * Math.sin(rad);
  return {
    position: "absolute",
    left: `${x}%`,
    top: `${y}%`,
    transform: "translate(-50%, -50%)",
    fontSize: size,
    lineHeight: 1,
    userSelect: "none",
    color: "rgba(180, 30, 70, 0.7)",
  };
}

export default function CDSpinner({ isPlaying, toName }: Props) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 28, perspective: 600 }}>
      <div
        style={{
          width: 200,
          height: 200,
          borderRadius: "50%",
          position: "relative",
          background: `conic-gradient(
            from 0deg,
            #ffd6e7 0deg,
            #f9c8ff 40deg,
            #c8d4ff 80deg,
            #c8f0ff 130deg,
            #e8ffc8 175deg,
            #fffac8 215deg,
            #ffd6c8 255deg,
            #ffc8e0 300deg,
            #ffd6e7 360deg
          )`,
          boxShadow: `
            0 0 0 3px rgba(0,0,0,0.07),
            inset 0 0 50px rgba(255,255,255,0.45),
            0 12px 32px rgba(0,0,0,0.2)
          `,
          animation: "cd-spin 4s linear infinite",
          animationPlayState: isPlaying ? "running" : "paused",
        }}
      >
        {/* Subtle ring grooves */}
        <div style={{
          position: "absolute", inset: "15%",
          borderRadius: "50%",
          boxShadow: `
            0 0 0 1px rgba(255,255,255,0.35),
            0 0 0 6px rgba(255,255,255,0.15),
            0 0 0 12px rgba(255,255,255,0.10),
            0 0 0 20px rgba(255,255,255,0.07),
            0 0 0 28px rgba(255,255,255,0.04)
          `,
          pointerEvents: "none",
        }} />

        {/* Hearts on disc */}
        {HEARTS.map((h, i) => (
          <span key={i} style={heartStyle(h.angle, h.r, h.size)}>♥</span>
        ))}

        {/* Centre label — counter-rotates to stay upright */}
        <div style={{
          position: "absolute",
          width: "38%", height: "38%",
          top: "31%", left: "31%",
          borderRadius: "50%",
          background: "radial-gradient(circle, #fff8fb 60%, #ffd6e7 100%)",
          boxShadow: "inset 0 0 10px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          animation: "cd-spin-reverse 4s linear infinite",
          animationPlayState: isPlaying ? "running" : "paused",
        }}>
          <span style={{
            fontFamily: "'Dancing Script', cursive",
            fontSize: 11,
            color: "#9b1535",
            fontWeight: 700,
            lineHeight: 1.2,
            textAlign: "center",
            padding: "0 4px",
          }}>
            4<br />{toName}
          </span>
        </div>

        {/* Centre hole */}
        <div style={{
          position: "absolute",
          width: "9%", height: "9%",
          top: "45.5%", left: "45.5%",
          borderRadius: "50%",
          background: "rgba(0,0,0,0.18)",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.3)",
        }} />
      </div>
    </div>
  );
}
