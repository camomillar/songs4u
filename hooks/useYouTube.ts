"use client";
import { useEffect, useRef, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type W = any;

function loadScript() {
  if (document.getElementById("yt-api-script")) return;
  const s = document.createElement("script");
  s.id = "yt-api-script";
  s.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(s);
}

export function useYouTube(initialVideoId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const readyRef = useRef(false);
  const currentIdRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);
  const wasPausedRef = useRef(false);
  const pendingRef = useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let destroyed = false;

    const div = document.createElement("div");
    // Must have real size — some browsers won't init a 1px iframe
    div.style.cssText =
      "position:fixed;bottom:-9999px;left:0;width:320px;height:180px;pointer-events:none;";
    document.body.appendChild(div);

    const init = () => {
      if (destroyed) return;
      const YT = (window as W).YT;
      if (!YT?.Player) return;

      playerRef.current = new YT.Player(div, {
        videoId: initialVideoId,
        playerVars: { autoplay: 0, playsinline: 1, controls: 0 },
        events: {
          onReady: () => {
            if (destroyed) return;
            readyRef.current = true;
            currentIdRef.current = initialVideoId;
            if (pendingRef.current) {
              const id = pendingRef.current;
              pendingRef.current = null;
              playerRef.current.loadVideoById(id);
              currentIdRef.current = id;
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onStateChange: (e: any) => {
            if (destroyed) return;
            const state = (window as W).YT?.PlayerState;
            if (e.data === state?.PLAYING) {
              isPlayingRef.current = true;
              wasPausedRef.current = false;
              setIsPlaying(true);
            } else if (e.data === state?.PAUSED) {
              isPlayingRef.current = false;
              wasPausedRef.current = true;
              setIsPlaying(false);
            } else if (e.data === state?.ENDED) {
              isPlayingRef.current = false;
              wasPausedRef.current = false;
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
      destroyed = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      readyRef.current = false;
      if (div.parentNode) div.parentNode.removeChild(div);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = (videoId: string) => {
    if (!readyRef.current || !playerRef.current) {
      // Not ready yet — queue it
      pendingRef.current = videoId;
      return;
    }

    if (currentIdRef.current === videoId && wasPausedRef.current) {
      // Same song, was paused — just resume
      playerRef.current.playVideo();
    } else {
      // New song OR first play — always use loadVideoById (reliable)
      playerRef.current.loadVideoById(videoId);
      currentIdRef.current = videoId;
      wasPausedRef.current = false;
    }
  };

  const pause = () => {
    if (!playerRef.current) return;
    playerRef.current.pauseVideo();
  };

  return { isPlaying, play, pause };
}
