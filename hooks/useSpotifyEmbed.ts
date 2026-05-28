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
  onSongEndRef.current = onSongEnd; // always up to date

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
            setIsPlaying(playing);
            // Detect natural song end: paused AND position is at/near duration
            if (!playing && e.data.duration > 0 && e.data.position >= e.data.duration - 1500) {
              onSongEndRef.current?.();
            }
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

  const loadTrack = (trackId: string) => {
    if (!controllerRef.current) return;
    controllerRef.current.loadUri(`spotify:track:${trackId}`);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    controllerRef.current?.togglePlay();
  };

  return { containerRef, isPlaying, ready, loadTrack, togglePlay };
}
