"use client";
import { useEffect, useRef, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type W = any;

export interface SpotifyTrack {
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
  uri: string;
}

export function useSpotifyPlayer(trackUris: string[]) {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const playerRef = useRef<W>(null);

  // Check premium
  useEffect(() => {
    fetch("/api/spotify/me")
      .then(r => r.json())
      .then(d => setIsPremium(d.product === "premium"))
      .catch(() => setIsPremium(false));
  }, []);

  // Load SDK only for premium users
  useEffect(() => {
    if (isPremium !== true) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    (window as W).onSpotifyWebPlaybackSDKReady = () => {
      const player = new (window as W).Spotify.Player({
        name: "Lovelist ♥",
        getOAuthToken: (cb: (t: string) => void) => {
          fetch("/api/auth/token")
            .then(r => r.json())
            .then(d => cb(d.access_token))
            .catch(() => cb(""));
        },
        volume: 0.8,
      });

      player.addListener("ready", ({ device_id }: { device_id: string }) => {
        setDeviceId(device_id);
        setReady(true);
      });

      player.addListener("player_state_changed", (state: W) => {
        if (!state) return;
        setIsPlaying(!state.paused);
        setCurrentTrack(state.track_window?.current_track ?? null);
      });

      player.connect();
      playerRef.current = player;
    };

    return () => {
      playerRef.current?.disconnect();
    };
  }, [isPremium]);

  const play = async (index = 0) => {
    if (!deviceId) return;
    await fetch("/api/spotify/player", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "play",
        deviceId,
        uris: trackUris,
        offset: { position: index },
      }),
    });
  };

  const togglePlay = async () => {
    if (!playerRef.current) return;
    await playerRef.current.togglePlay();
  };

  const next = async () => {
    if (!playerRef.current) return;
    await playerRef.current.nextTrack();
  };

  const previous = async () => {
    if (!playerRef.current) return;
    await playerRef.current.previousTrack();
  };

  return { isPremium, ready, deviceId, isPlaying, currentTrack, play, togglePlay, next, previous };
}
