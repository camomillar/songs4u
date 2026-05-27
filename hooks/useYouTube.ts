"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Simplest possible YouTube player.
 * Injects an iframe with autoplay=1 directly on play().
 * No IFrame API — no onReady timing issues, works on every click.
 */
export function useYouTube() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const div = document.createElement("div");
    div.style.cssText =
      "position:fixed;bottom:0;left:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;z-index:-1;";
    document.body.appendChild(div);
    containerRef.current = div;
    return () => {
      div.innerHTML = "";
      if (div.parentNode) div.parentNode.removeChild(div);
    };
  }, []);

  const play = (videoId: string) => {
    if (!containerRef.current) return;
    // Replacing innerHTML starts the new video immediately with autoplay
    containerRef.current.innerHTML = `<iframe
      src="https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&enablejsapi=0"
      style="width:480px;height:270px;border:0;"
      allow="autoplay; encrypted-media"
      allowfullscreen
    ></iframe>`;
    setIsPlaying(true);
  };

  const pause = () => {
    if (!containerRef.current) return;
    // Removing the iframe stops audio immediately
    containerRef.current.innerHTML = "";
    setIsPlaying(false);
  };

  return { isPlaying, play, pause };
}
