"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import HeartParticles, { darkenHex } from "@/components/HeartParticles";
import { ValentinesPlaylist } from "@/lib/encode";
import { useSpotifyEmbed } from "@/hooks/useSpotifyEmbed";
import JewelCase from "@/components/JewelCase";

function JewelCaseWrapper({ playlist }: { playlist: ValentinesPlaylist }) {
  const songs = playlist.songs;
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const next = () => {
    const ni = (currentIndexRef.current + 1) % songs.length;
    setCurrentIndex(ni);
    loadTrack(songs[ni].id);
  };

  const { containerRef, isPlaying, ready, loadTrack, togglePlay } = useSpotifyEmbed(songs[0].id, next);
  const song = songs[currentIndex];

  return (
    <>
      <div style={{ position: "fixed", bottom: 0, left: 0, width: 300, height: 80, transform: "scale(0)", transformOrigin: "bottom left", pointerEvents: "none" }}>
        <div ref={containerRef} style={{ width: 300, height: 80 }} />
      </div>
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
        song={song}
        songs={songs}
        total={songs.length}
        onBack={() => window.history.back()}
      />
    </>
  );
}

export default function SharePageContent({ playlist }: { playlist: ValentinesPlaylist }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  // Fix background on body so it doesn't scroll on mobile
  useEffect(() => {
    document.body.style.background = playlist.bgColor || "#fff";
    return () => { document.body.style.background = ""; };
  }, [playlist.bgColor]);

  useEffect(() => {
    fetch("/api/spotify/me")
      .then(r => { setIsAuthed(r.ok); setAuthChecked(true); })
      .catch(() => setAuthChecked(true));
  }, []);

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", background: playlist.bgColor || "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <HeartParticles color={playlist.bgColor ? darkenHex(playlist.bgColor) : undefined} />
        <p style={{ fontFamily: "system-ui", fontSize: 14, color: "#999" }}>Loading...</p>
      </div>
    );
  }

  if (!isAuthed) {
    const redirectUrl = typeof window !== "undefined" ? window.location.href : "/";
    return (
      <div style={{ minHeight: "100vh", background: playlist.bgColor || "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, padding: 24 }}>
        <HeartParticles color={playlist.bgColor ? darkenHex(playlist.bgColor) : undefined} />
        <div style={{ position: "relative" }}>
          <Image src="/case-closed.png" alt="CD" width={220} height={220} style={{ objectFit: "contain", filter: "blur(3px)", opacity: 0.6 }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🔒</div>
        </div>
        <div style={{ textAlign: "center", maxWidth: 300, zIndex: 1 }}>
          <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: 26, color: "#3a2010", marginBottom: 10 }}>Someone made you a playlist ♥</p>
          <p style={{ fontFamily: "system-ui", fontSize: 14, color: "#888", marginBottom: 24, lineHeight: 1.6 }}>Log in with Spotify to open it and hear the full songs</p>
          <form action={`/api/auth/login?context=player&redirect=${encodeURIComponent(redirectUrl)}`} method="GET">
            <button type="submit" style={{ background: "#1DB954", color: "white", border: "none", borderRadius: 50, padding: "14px 32px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "system-ui", display: "flex", alignItems: "center", gap: 10, margin: "0 auto" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Login with Spotify
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <JewelCaseWrapper playlist={playlist} />;
}
