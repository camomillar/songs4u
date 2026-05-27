"use client";
import { useEffect, useRef, useState } from "react";

export function useYouTube() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const div = document.createElement("div");
    // Off-screen but NOT opacity:0 — browsers block autoplay on invisible iframes
    div.style.cssText =
      "position:fixed;top:-9999px;left:-9999px;width:480px;height:270px;pointer-events:none;";
    document.body.appendChild(div);
    containerRef.current = div;

    return () => {
      div.innerHTML = "";
      if (div.parentNode) div.parentNode.removeChild(div);
    };
  }, []);

  const play = (videoId: string) => {
    const container = containerRef.current;
    if (!container) return;

    // Remove old iframe first
    container.innerHTML = "";

    // Build iframe with createElement so attributes are set properly
    const iframe = document.createElement("iframe");
    iframe.width = "480";
    iframe.height = "270";
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`;
    iframe.setAttribute("allow", "autoplay; encrypted-media; fullscreen");
    iframe.setAttribute("allowfullscreen", "");
    iframe.style.border = "0";

    container.appendChild(iframe);
    setIsPlaying(true);
  };

  const pause = () => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    setIsPlaying(false);
  };

  return { isPlaying, play, pause };
}
