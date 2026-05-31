"use client";
import { useEffect, useRef } from "react";

export function darkenHex(hex: string, amount = 60): string {
  const clean = hex.replace("#", "");
  const r = Math.max(0, parseInt(clean.slice(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(clean.slice(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(clean.slice(4, 6), 16) - amount);
  return `rgb(${r},${g},${b})`;
}

interface Props {
  color?: string;
  isPlaying?: boolean;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
}

export default function DotField({ color = "rgba(100,100,120,0.5)", isPlaying = false, audioRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Set up Web Audio analyser when audio element is available
  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio || analyserRef.current) return;
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
      audioCtxRef.current = ctx;
    } catch {
      // Cross-origin or already connected — fall back to time-based
    }
  }, [audioRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Match canvas to screen size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas.width;
    const H = () => canvas.height;

    // Generate blob of dots — Gaussian-ish distribution from center
    const DOT_COUNT = 260;
    type Dot = { nx: number; ny: number; baseSz: number; phase: number; dist: number };
    const dots: Dot[] = [];

    for (let i = 0; i < DOT_COUNT; i++) {
      // Two gaussian samples via Box-Muller
      const u = Math.random(), v = Math.random();
      const gauss = Math.sqrt(-2 * Math.log(u + 0.0001)) * Math.cos(2 * Math.PI * v);
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.abs(gauss) * 0.18; // normalized distance from center
      const clampDist = Math.min(dist, 0.48);
      dots.push({
        nx: 0.5 + Math.cos(angle) * clampDist,
        ny: 0.5 + Math.sin(angle) * clampDist,
        baseSz: Math.max(2, 14 * Math.pow(Math.max(0, 1 - clampDist / 0.48), 1.8)),
        phase: Math.random() * Math.PI * 2,
        dist: clampDist,
      });
    }

    const dataArray = analyserRef.current
      ? new Uint8Array(analyserRef.current.frequencyBinCount)
      : null;

    const ctx2d = canvas.getContext("2d")!;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      ctx2d.clearRect(0, 0, W(), H());

      const t = Date.now() / 1000;

      // Get bass energy from analyser OR fall back to time-based BPM
      let bass = 0;
      if (analyserRef.current && dataArray && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArray);
        bass = Array.from(dataArray.slice(0, 6)).reduce((a, b) => a + b, 0) / 6 / 255;
      } else if (isPlaying) {
        // Simulate ~100 BPM pulse
        bass = Math.max(0, Math.sin(t * Math.PI * 100 / 60)) * 0.5;
      } else {
        // Idle gentle breath
        bass = (Math.sin(t * 0.8) + 1) / 2 * 0.08;
      }

      for (const dot of dots) {
        const x = dot.nx * W();
        const y = dot.ny * H();

        // Ripple: dots further from center pulse with slight delay
        const rippleDelay = dot.dist * 3;
        const pulse = 1 + bass * 1.2 * Math.max(0, Math.sin(t * 4 - rippleDelay + dot.phase * 0.3));
        const sz = dot.baseSz * pulse;

        // Opacity based on distance from center
        const alpha = Math.max(0, (0.55 - dot.dist) * 1.4) * (0.3 + bass * 0.4);

        ctx2d.beginPath();
        ctx2d.arc(x, y, sz, 0, Math.PI * 2);
        ctx2d.fillStyle = color;
        ctx2d.globalAlpha = Math.min(alpha, 0.65);
        ctx2d.fill();
      }

      ctx2d.globalAlpha = 1;
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [color, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
