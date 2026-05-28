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

  const prev = () => {
    const pi = (currentIndexRef.current - 1 + songs.length) % songs.length;
    setCurrentIndex(pi);
    loadTrack(songs[pi].id);
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
        onPrev={prev}
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

  // Fix background on html+body so it doesn't scroll or leak on mobile
  useEffect(() => {
    const color = playlist.bgColor || "#fff";
    document.documentElement.style.background = color;
    document.body.style.background = color;
    return () => {
      document.documentElement.style.background = "";
      document.body.style.background = "";
    };
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
    const hex = (playlist.bgColor || "#fff").replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const isDark = (r * 299 + g * 587 + b * 114) / 1000 < 128;
    return (
      <div style={{ minHeight: "100vh", background: playlist.bgColor || "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, padding: 24 }}>
        <HeartParticles color={playlist.bgColor ? darkenHex(playlist.bgColor) : undefined} />
        {/* CD case with cover image + lock */}
        <div style={{ position: "relative", width: 220, height: 220 }}>
          {playlist.coverImage ? (
            <>
              {/* Case frame with user's cover photo */}
              <div style={{
                width: 220, height: 220,
                position: "relative",
                borderRadius: 4,
                overflow: "hidden",
                filter: "blur(1.5px)",
                opacity: 0.65,
                boxShadow: "4px 6px 20px rgba(0,0,0,0.25)",
              }}>
                {/* Spine */}
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 18, background: "#1a1a1a", zIndex: 2 }} />
                {/* Cover photo */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={playlist.coverImage} alt="cover" style={{
                  position: "absolute", left: 18, top: 0, right: 0, bottom: 0,
                  width: "calc(100% - 18px)", height: "100%",
                  objectFit: "cover", imageRendering: "auto", display: "block",
                }} />
              </div>
            </>
          ) : (
            <Image src="/case-closed.png" alt="CD" width={220} height={220} style={{ objectFit: "contain", filter: "blur(3px)", opacity: 0.6 }} />
          )}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🔒</div>
        </div>
        <div style={{ textAlign: "center", maxWidth: 300, zIndex: 1 }}>
          <p style={{ fontFamily: "'OrdinaryLetter', cursive", fontSize: 32, color: isDark ? "#fff" : "#3a2010", marginBottom: 10, lineHeight: 1.3 }}>
            Someone made you<br />a playlist &lt;3
          </p>
          <p style={{ fontFamily: "system-ui", fontSize: 14, color: "#888", marginBottom: 24, lineHeight: 1.8 }}>
            Log in with Spotify to open<br />and hear the songs
          </p>
          <form action="/api/auth/login" method="GET">
            <input type="hidden" name="context" value="player" />
            <input type="hidden" name="redirect" value={redirectUrl} />
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
