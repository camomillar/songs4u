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

const EMOJIS = ["♥", "♥", "♥", "✦", "♡"];

export default function HeartParticles() {
  const [hearts, setHearts] = useState<Heart[]>([]);

  useEffect(() => {
    setHearts(
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        duration: 6 + Math.random() * 8,
        delay: Math.random() * 8,
        size: 10 + Math.floor(Math.random() * 3) * 4,
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
          }}
        >
          {h.emoji}
        </span>
      ))}
    </div>
  );
}
