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

export function useYouTube() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const readyRef = useRef(false);
  const loadedIdRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const div = document.createElement("div");
    div.style.cssText =
      "position:fixed;bottom:-200px;left:0;width:1px;height:1px;overflow:hidden;pointer-events:none;";
    document.body.appendChild(div);

    const init = () => {
      const YT = (window as W).YT;
      if (!YT?.Player) return;
      playerRef.current = new YT.Player(div, {
        playerVars: { playsinline: 1, controls: 0 },
        events: {
          onReady: () => { readyRef.current = true; },
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
      (window as W).onYouTubeIframeAPIReady = () => { prev?.(); init(); };
      loadScript();
    }

    return () => {
      playerRef.current?.destroy();
      if (div.parentNode) div.parentNode.removeChild(div);
    };
  }, []);

  /** Play a video — resumes if same song, loads fresh if different */
  const play = (videoId: string) => {
    if (!readyRef.current || !playerRef.current) return;
    if (loadedIdRef.current === videoId) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.loadVideoById(videoId);
      loadedIdRef.current = videoId;
    }
  };

  const pause = () => {
    playerRef.current?.pauseVideo();
  };

  return { isPlaying, play, pause };
}
