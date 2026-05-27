"use client";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (opts: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume: number;
      }) => SpotifyPlayer;
    };
  }
}

interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(event: string, cb: (data: unknown) => void): void;
  getCurrentState(): Promise<SpotifyState | null>;
  togglePlay(): Promise<void>;
  nextTrack(): Promise<void>;
  previousTrack(): Promise<void>;
  seek(ms: number): Promise<void>;
}

export interface SpotifyState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: {
      id: string;
      name: string;
      uri: string;
      artists: { name: string }[];
      album: { name: string; images: { url: string }[] };
      duration_ms: number;
    };
  };
}

export function usePlayer() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [state, setState] = useState<SpotifyState | null>(null);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [progressMs, setProgressMs] = useState(0);

  // Tick progress locally between server updates
  useEffect(() => {
    if (state && !state.paused) {
      const started = Date.now() - state.position;
      progressInterval.current = setInterval(() => {
        setProgressMs(Date.now() - started);
      }, 500);
    } else if (state) {
      setProgressMs(state.position);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [state]);

  useEffect(() => {
    // Check premium status
    fetch("/api/spotify/me")
      .then((r) => r.json())
      .then((d) => setIsPremium(d.product === "premium"))
      .catch(() => setIsPremium(false));
  }, []);

  useEffect(() => {
    if (isPremium === false) return;
    if (isPremium === null) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: "Pixel Player",
        getOAuthToken: (cb) => {
          fetch("/api/spotify/me") // any auth'd endpoint to force token refresh
            .then(() => {
              // Get token from a dedicated endpoint
              fetch("/api/auth/token")
                .then((r) => r.json())
                .then((d) => cb(d.access_token))
                .catch(() => cb(""));
            });
        },
        volume: 0.8,
      });

      player.addListener("ready", (data: unknown) => {
        const d = data as { device_id: string };
        setDeviceId(d.device_id);
        // Transfer playback here
        fetch("/api/spotify/player", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "transfer", deviceId: d.device_id }),
        });
      });

      player.addListener("player_state_changed", (s: unknown) => {
        if (s) setState(s as SpotifyState);
      });

      player.connect();
      playerRef.current = player;
    };

    return () => {
      playerRef.current?.disconnect();
      document.body.removeChild(script);
    };
  }, [isPremium]);

  const play = useCallback(
    async (contextUri?: string, uris?: string[], offset?: { position: number }) => {
      if (!deviceId) return;
      await fetch("/api/spotify/player", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "play",
          deviceId,
          ...(contextUri ? { contextUri } : {}),
          ...(uris ? { uris } : {}),
          ...(offset ? { offset } : {}),
        }),
      });
    },
    [deviceId]
  );

  const togglePlay = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.togglePlay();
    } else {
      const s = state?.paused === false
        ? await fetch("/api/spotify/player", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "pause" }),
          })
        : await fetch("/api/spotify/player", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "play", deviceId }),
          });
      await s;
      // Poll for state
      setTimeout(pollState, 500);
    }
  }, [deviceId, state]);

  const next = useCallback(async () => {
    if (playerRef.current) await playerRef.current.nextTrack();
    else {
      await fetch("/api/spotify/player", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "next" }),
      });
      setTimeout(pollState, 800);
    }
  }, []);

  const previous = useCallback(async () => {
    if (playerRef.current) await playerRef.current.previousTrack();
    else {
      await fetch("/api/spotify/player", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "previous" }),
      });
      setTimeout(pollState, 800);
    }
  }, []);

  const seek = useCallback(async (ms: number) => {
    if (playerRef.current) await playerRef.current.seek(ms);
    else {
      await fetch("/api/spotify/player", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seek", positionMs: ms }),
      });
    }
    setProgressMs(ms);
  }, []);

  const pollState = useCallback(async () => {
    const res = await fetch("/api/spotify/player");
    const data = await res.json();
    if (data?.item) {
      setState({
        paused: !data.is_playing,
        position: data.progress_ms,
        duration: data.item.duration_ms,
        track_window: {
          current_track: {
            id: data.item.id,
            name: data.item.name,
            uri: data.item.uri,
            artists: data.item.artists,
            album: data.item.album,
            duration_ms: data.item.duration_ms,
          },
        },
      });
    }
  }, []);

  // Poll state every 5s — only when authenticated
  useEffect(() => {
    if (isPremium === null) return;
    const iv = setInterval(pollState, 5000);
    pollState();
    return () => clearInterval(iv);
  }, [pollState, isPremium]);

  const currentTrack = state?.track_window?.current_track ?? null;

  return {
    deviceId,
    isPremium,
    state,
    currentTrack,
    isPlaying: state ? !state.paused : false,
    progressMs,
    play,
    togglePlay,
    next,
    previous,
    seek,
  };
}
