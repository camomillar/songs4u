"use client";
import { useEffect, useRef, useState } from "react";

export function useAudioPlayer(initialTrackUrl: string | undefined, onSongEnd?: () => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const onSongEndRef = useRef(onSongEnd);
  onSongEndRef.current = onSongEnd;

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.addEventListener("canplay", () => setReady(true));
    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      onSongEndRef.current?.();
    });

    if (initialTrackUrl) {
      audio.src = initialTrackUrl;
      audio.load();
    }

    return () => {
      audio.pause();
      audio.src = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTrack = (trackUrl: string | undefined) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
    setReady(false);
    if (!trackUrl) return;
    audio.src = trackUrl;
    audio.load();
    audio.play().catch(() => {});
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  return { isPlaying, ready, loadTrack, togglePlay };
}
