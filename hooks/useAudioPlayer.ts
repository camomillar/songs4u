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

    const onCanPlay = () => setReady(true);
    const onPlay    = () => setIsPlaying(true);
    const onPause   = () => setIsPlaying(false);
    const onEnded   = () => { setIsPlaying(false); onSongEndRef.current?.(); };

    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("play",    onPlay);
    audio.addEventListener("pause",   onPause);
    audio.addEventListener("ended",   onEnded);

    if (initialTrackUrl) {
      audio.src = initialTrackUrl;
      audio.load();
    }

    return () => {
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("play",    onPlay);
      audio.removeEventListener("pause",   onPause);
      audio.removeEventListener("ended",   onEnded);
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
    if (!trackUrl) {
      // No preview available — mark ready so UI doesn't stay stuck
      setReady(false);
      return;
    }
    setReady(false);
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
