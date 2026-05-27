"use client";
import { useMemo } from "react";

export default function StarField() {
  const stars = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        size: Math.random() > 0.5 ? 4 : 6,
      })),
    []
  );

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
