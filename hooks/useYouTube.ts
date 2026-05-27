"use client";
import { useEffect, useRef, useState } from "react";

function loadScript() {
  if (document.getElementById("yt-api-script")) return;
  const s = document.createElement("script");
  s.id = "yt-api-script";
  s.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(s);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type W = any;

export function useYouTube(videoId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const divRef = useRef<HTMLDivElement | null>(null);
  const readyRef = useRef(false);
  const isPlayingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const div = document.createElement("div");
    div.style.cssText =
      "position:fixed;bottom:-200px;left:0;width:1px;height:1px;overflow:hidden;pointer-events:none;";
    document.body.appendChild(div);
    divRef.current = div;

    const init = () => {
      const YT = (window as W).YT;
      if (!YT?.Player) return;
      playerRef.current = new YT.Player(div, {
        videoId,
        playerVars: { autoplay: 0, playsinline: 1, controls: 0 },
        events: {
          onReady: () => {
            readyRef.current = true;
            setReady(true);
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onStateChange: (e: any) => {
            const state = (window as W).YT?.PlayerState;
            if (e.data === state?.PLAYING) {
              isPlayingRef.current = true;
              setIsPlaying(true);
            } else if (e.data === state?.PAUSED || e.data === state?.ENDED) {
              isPlayingRef.current = false;
              setIsPlaying(false);
            }
          },
        },
      });
    };

    if ((window as W).YT?.Player) {
      init();
    } else {
      const prev = (window as W).onYouTubeIframeAPIReady;
      (window as W).onYouTubeIframeAPIReady = () => {
        prev?.();
        init();
      };
      loadScript();
    }

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
      if (divRef.current && document.body.contains(divRef.current)) {
        document.body.removeChild(divRef.current);
      }
    };
  }, []); // mount once

  // Swap video when song changes
  useEffect(() => {
    if (readyRef.current && playerRef.current) {
      playerRef.current.loadVideoById(videoId);
      isPlayingRef.current = true;
      setIsPlaying(true);
    }
  }, [videoId]);

  const toggle = () => {
    if (!playerRef.current || !readyRef.current) return;
    if (isPlayingRef.current) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  return { isPlaying, ready, toggle };
}
