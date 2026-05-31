"use client";
import { useEffect, useState } from "react";

interface Heart {
  id: number;
  left: number;
  duration: number;
  delay: number;
  size: number;
  emoji: string;
}

const PARTICLE_SETS: Record<string, string[]> = {
  hearts:  ["♥", "♥", "♥", "✦", "♡", "✦", "✧"],
  stars:   ["✦", "✧", "★", "✦", "✩", "✧", "★"],
  notes:   ["♪", "♫", "♩", "♬", "♪", "♫", "♩"],
  flowers: ["✿", "❀", "✾", "✿", "❁"],
  kisses:  ["✕", "♡", "✕", "✦", "✕"],
  bows:    ["⋈", "⋈", "✦", "⋈", "⋈"],
  none:    [],
};

/** Darkens a hex colour by `amount` (0–255) */
export function darkenHex(hex: string, amount = 100): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;
  // Very dark background — use semi-transparent white instead
  if (luminance < 40) return `rgba(255,255,255,0.18)`;
  return `rgb(${Math.max(0, r - amount)},${Math.max(0, g - amount)},${Math.max(0, b - amount)})`;
}

interface Props {
  color?: string;
  type?: "hearts" | "stars" | "notes" | "flowers" | "none";
}

export default function HeartParticles({ color, type = "hearts" }: Props) {
  if (type === "none") return null;
  const EMOJIS = PARTICLE_SETS[type];
  const [hearts, setHearts] = useState<Heart[]>([]);

  useEffect(() => {
    setHearts(
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        duration: 6 + Math.random() * 8,
        delay: Math.random() * 8,
        size: 16 + Math.floor(Math.random() * 3) * 6,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      }))
    );
  }, []);

  return (
    <div className="hearts-bg" aria-hidden>
      {hearts.map((h) => (
        <span
          key={h.id}
          className="heart-particle"
          style={{
            left: `${h.left}%`,
            fontSize: h.size,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}s`,
            color: color ?? "var(--accent)",
          }}
        >
          {h.emoji}
        </span>
      ))}
    </div>
  );
}
