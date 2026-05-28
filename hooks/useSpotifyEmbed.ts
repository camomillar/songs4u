"use client";
import { useEffect, useRef, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type W = any;

export function useSpotifyEmbed(initialTrackId: string, onSongEnd?: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controllerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const onSongEndRef = useRef(onSongEnd);
  onSongEndRef.current = onSongEnd;

  // Track playback state to detect song end reliably
  const wasPlayingRef = useRef(false);
  const lastPositionRef = useRef(0);
  const lastDurationRef = useRef(0);
  const endFiredRef = useRef(false); // prevent double-fire

  useEffect(() => {
    const initApi = (IFrameAPI: W) => {
      if (!containerRef.current) return;
      IFrameAPI.createController(
        containerRef.current,
        { uri: `spotify:track:${initialTrackId}` },
        (controller: W) => {
          controllerRef.current = controller;
          setReady(true);

          controller.addListener("playback_update", (e: W) => {
            const playing = !e.data.isPaused;
            const pos = e.data.position ?? 0;
            const dur = e.data.duration ?? 0;

            setIsPlaying(playing);

            // Detect song end: was playing → now paused
            if (wasPlayingRef.current && !playing && !endFiredRef.current) {
              const wasNearEnd = lastPositionRef.current > 0 && lastDurationRef.current > 0 &&
                lastPositionRef.current >= lastDurationRef.current * 0.8;
              const posReset = pos < 1000 && lastPositionRef.current > 0;

              if (wasNearEnd || posReset) {
                endFiredRef.current = true;
                setTimeout(() => { endFiredRef.current = false; }, 2000);
                onSongEndRef.current?.();
              }
            }

            wasPlayingRef.current = playing;
            if (pos > 0) lastPositionRef.current = pos;
            if (dur > 0) lastDurationRef.current = dur;
          });
        }
      );
    };

    if ((window as W).SpotifyIframeApi) {
      initApi((window as W).SpotifyIframeApi);
    } else {
      (window as W).onSpotifyIframeApiReady = (api: W) => {
        (window as W).SpotifyIframeApi = api;
        initApi(api);
      };
      if (!document.getElementById("spotify-embed-api")) {
        const s = document.createElement("script");
        s.id = "spotify-embed-api";
        s.src = "https://open.spotify.com/embed/iframe-api/v1";
        s.async = true;
        document.head.appendChild(s);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset end detection when track changes
  const loadTrack = (trackId: string) => {
    if (!controllerRef.current) return;
    wasPlayingRef.current = false;
    lastPositionRef.current = 0;
    lastDurationRef.current = 0;
    endFiredRef.current = false;
    controllerRef.current.loadUri(`spotify:track:${trackId}`);
    // Resume after a short delay to let the embed load the track
    setTimeout(() => controllerRef.current?.resume(), 500);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    controllerRef.current?.togglePlay();
  };

  return { containerRef, isPlaying, ready, loadTrack, togglePlay };
}
