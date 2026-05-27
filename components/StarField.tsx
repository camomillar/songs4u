"use client";
import { useEffect, useState } from "react";

interface Star {
  id: number;
  top: number;
  left: number;
  delay: number;
  size: number;
}

export default function StarField() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    setStars(
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        size: Math.random() > 0.5 ? 4 : 6,
      }))
    );
  }, []);

  return (
    <div className="stars" aria-hidden>
      {stars.map((s) => (
        <div
          key={s.id}
          className="star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            animationDelay: `${s.delay}s`,
            width: s.size,
            height: s.size,
          }}
        />
      ))}
    </div>
  );
}
