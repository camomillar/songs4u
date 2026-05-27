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

/**
 * useYouTube(initialVideoId)
 *
 * Creates ONE YouTube player for the lifetime of the component.
 * The player is created with `initialVideoId` so onReady always fires.
 * Call play(id) / pause() directly from click handlers.
 */
export function useYouTube(initialVideoId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const readyRef = useRef(false);
  const loadedIdRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);
  const pendingRef = useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let destroyed = false;

    const div = document.createElement("div");
    div.style.cssText =
      "position:fixed;bottom:-300px;left:0;width:200px;height:200px;overflow:hidden;pointer-events:none;opacity:0;";
    document.body.appendChild(div);

    const init = () => {
      if (destroyed) return;
      const YT = (window as W).YT;
      if (!YT?.Player) return;

      playerRef.current = new YT.Player(div, {
        videoId: initialVideoId, // REQUIRED — without this onReady never fires
        playerVars: { autoplay: 0, playsinline: 1, controls: 0 },
        events: {
          onReady: () => {
            if (destroyed) return;
            readyRef.current = true;
            loadedIdRef.current = initialVideoId;
            // Fire any queued play request
            if (pendingRef.current) {
              const id = pendingRef.current;
              pendingRef.current = null;
              if (id === initialVideoId) {
                playerRef.current.playVideo();
              } else {
                playerRef.current.loadVideoById(id);
                loadedIdRef.current = id;
              }
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onStateChange: (e: any) => {
            if (destroyed) return;
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
      destroyed = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      readyRef.current = false;
      if (div.parentNode) div.parentNode.removeChild(div);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount once — initialVideoId is captured in closure

  /** Play a specific video. Queues if the player isn't ready yet. */
  const play = (videoId: string) => {
    if (!readyRef.current || !playerRef.current) {
      pendingRef.current = videoId;
      return;
    }
    if (loadedIdRef.current === videoId) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.loadVideoById(videoId);
      loadedIdRef.current = videoId;
    }
  };

  const pause = () => {
    playerRef.current?.pauseVideo();
    isPlayingRef.current = false;
    setIsPlaying(false);
  };

  return { isPlaying, play, pause };
}
