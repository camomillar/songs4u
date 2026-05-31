"use client";
import { useEffect, useRef, useState } from "react";
import { ValentinesPlaylist } from "@/lib/encode";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import JewelCase from "@/components/JewelCase";

function JewelCaseWrapper({ playlist, playlistId }: { playlist: ValentinesPlaylist; playlistId?: string; }) {
  const songs = playlist.songs;
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const next = () => {
    const ni = (currentIndexRef.current + 1) % songs.length;
    setCurrentIndex(ni);
    loadTrack(songs[ni].previewUrl);
  };

  const prev = () => {
    const pi = (currentIndexRef.current - 1 + songs.length) % songs.length;
    setCurrentIndex(pi);
    loadTrack(songs[pi].previewUrl);
  };

  const { isPlaying, ready, loadTrack, togglePlay } = useAudioPlayer(songs[0].previewUrl, next);
  const song = songs[currentIndex];

  return (
    <JewelCase
      to={playlist.to}
      from={playlist.from}
      message={playlist.message}
      bgColor={playlist.bgColor}
      coverImage={playlist.coverImage}
      isPlaying={isPlaying}
      ready={ready}
      onTogglePlay={togglePlay}
      onNext={next}
      onPrev={prev}
      song={song}
      songs={songs}
      total={songs.length}
      onBack={() => window.history.back()}
      playlistId={playlistId}
      particles={playlist.particles}
    />
  );
}

export default function SharePageContent({ playlist, playlistId }: { playlist: ValentinesPlaylist; playlistId?: string }) {
  useEffect(() => {
    const color = playlist.bgColor || "#fff";
    document.documentElement.style.background = color;
    document.body.style.background = color;
    return () => {
      document.documentElement.style.background = "";
      document.body.style.background = "";
    };
  }, [playlist.bgColor]);

  return <JewelCaseWrapper playlist={playlist} playlistId={playlistId} />;
}
