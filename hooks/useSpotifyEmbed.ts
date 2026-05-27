"use client";
import { useEffect, useRef, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type W = any;

export function useSpotifyEmbed(initialTrackId: string) {
  const containerRef = useRef<HTMLDivElement>(null); // div placeholder — Spotify replaces it with an iframe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controllerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);

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
            setIsPlaying(!e.data.isPaused);
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
    controllerRef.current?.loadUri(`spotify:track:${trackId}`);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    controllerRef.current?.togglePlay();
  };

  return { containerRef, isPlaying, ready, loadTrack, togglePlay };
}
