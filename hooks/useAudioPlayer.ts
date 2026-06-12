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
    // If a URL fails to load (expired, network error), re-enable the button so user can skip
    const onError   = () => { setReady(true); setIsPlaying(false); };

    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("play",    onPlay);
    audio.addEventListener("pause",   onPause);
    audio.addEventListener("ended",   onEnded);
    audio.addEventListener("error",   onError);

    if (initialTrackUrl) {
      audio.src = initialTrackUrl;
      audio.load();
    }

    return () => {
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("play",    onPlay);
      audio.removeEventListener("pause",   onPause);
      audio.removeEventListener("ended",   onEnded);
      audio.removeEventListener("error",   onError);
      audio.pause();
      audio.src = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update audio src without auto-playing (used when fresh URLs arrive after mount)
  const silentLoad = (trackUrl: string | undefined) => {
    const audio = audioRef.current;
    if (!audio || audio.src === trackUrl) return;
    const wasPlaying = !audio.paused;
    audio.pause();
    setIsPlaying(false);
    if (!trackUrl) { setReady(true); return; }
    setReady(false);
    audio.src = trackUrl;
    audio.load();
    if (wasPlaying) audio.play().catch(() => {});
  };

  const loadTrack = (trackUrl: string | undefined) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
    if (!trackUrl) {
      // No preview available — keep ready=true so user can still navigate
      setReady(true);
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

  return { isPlaying, ready, loadTrack, silentLoad, togglePlay };
}
