"use client";
import { useEffect, useRef, useState } from "react";
import { ValentinesPlaylist } from "@/lib/encode";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import JewelCase from "@/components/JewelCase";
import posthog from "posthog-js";

const T = {
  en: {
    clickToOpen: "Tap to open",
    shareToStory: "Share",
    noPreview: "no preview available",
    madeWith: "Made with ♥ by",
    createOwn: "Create your playlist here",
  },
  pt: {
    clickToOpen: "Toque para abrir",
    shareToStory: "Compartilhar",
    noPreview: "prévia não disponível",
    madeWith: "Feito com ♥ por",
    createOwn: "Crie sua playlist aqui",
  },
};

function JewelCaseWrapper({ playlist, playlistId, lang }: { playlist: ValentinesPlaylist; playlistId?: string; lang: "en" | "pt" }) {
  const songs = playlist.songs;
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const next = () => {
    const ni = (currentIndexRef.current + 1) % songs.length;
    setCurrentIndex(ni);
    loadTrack(songs[ni].previewUrl);
    posthog.capture("song_skipped", { direction: "next", from: currentIndexRef.current, to: ni, total_songs: songs.length });
  };

  const prev = () => {
    const pi = (currentIndexRef.current - 1 + songs.length) % songs.length;
    setCurrentIndex(pi);
    loadTrack(songs[pi].previewUrl);
    posthog.capture("song_skipped", { direction: "prev", from: currentIndexRef.current, to: pi, total_songs: songs.length });
  };

  const { isPlaying, ready, loadTrack, togglePlay } = useAudioPlayer(songs[0].previewUrl, next);

  const handleTogglePlay = () => {
    if (!isPlaying) {
      posthog.capture("song_played", { song_index: currentIndexRef.current, song_title: songs[currentIndexRef.current]?.title, song_artist: songs[currentIndexRef.current]?.artist, total_songs: songs.length });
    }
    togglePlay();
  };
  const song = songs[currentIndex];
  const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const t = {
    ...T[lang],
    clickToOpen: isTouch
      ? T[lang].clickToOpen
      : lang === "pt" ? "Clique para abrir" : "Click to open",
  };

  return (
    <JewelCase
      to={playlist.to}
      from={playlist.from}
      title={playlist.title}
      message={playlist.message}
      bgColor={playlist.bgColor}
      coverImage={playlist.coverImage}
      isPlaying={isPlaying}
      ready={ready}
      onTogglePlay={handleTogglePlay}
      onNext={next}
      onPrev={prev}
      song={song}
      songs={songs}
      total={songs.length}
      onBack={() => window.history.back()}
      playlistId={playlistId}
      particles={playlist.particles}
      stickers={playlist.stickers}
      i18n={t}
      lang={lang}
    />
  );
}

export default function SharePageContent({ playlist, playlistId }: { playlist: ValentinesPlaylist; playlistId?: string }) {
  const [lang, setLang] = useState<"en" | "pt">("pt");
  const [langOpen, setLangOpen] = useState(false);
  const isDark = (() => {
    const hex = (playlist.bgColor || "#fff").replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  })();

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
    track("playlist_opened", { songs: playlist.songs.length });
    posthog.capture("playlist_opened", { songs_count: playlist.songs.length, has_cover: !!playlist.coverImage, has_message: !!playlist.message, bg_color: playlist.bgColor });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Language toggle */}
      <div style={{ position: "fixed", top: 24, right: 28, zIndex: 50 }}>
        <button
          onClick={() => setLangOpen(o => !o)}
          style={{
            fontFamily: "system-ui", fontSize: 12, fontWeight: 600,
            background: isDark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.85)",
            border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(0,0,0,0.1)",
            borderRadius: 99, padding: "6px 12px", cursor: "pointer",
            color: isDark ? "#fff" : "#444",
            display: "flex", alignItems: "center", gap: 6,
            backdropFilter: "blur(8px)",
          }}
        >
          {lang === "en" ? "🇺🇸" : "🇧🇷"} {lang === "en" ? "EN" : "PT"} <span style={{ fontSize: 9, opacity: 0.6 }}>▾</span>
        </button>
        {langOpen && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
            background: "white", border: "1px solid #e0e0e0", borderRadius: 12,
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            overflow: "hidden", minWidth: 130,
          }}>
            {([
              { code: "pt", flag: "🇧🇷", label: "Português" },
              { code: "en", flag: "🇺🇸", label: "English" },
            ] as const).map(({ code, flag, label }) => (
              <button
                key={code}
                onClick={() => { setLang(code); setLangOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", border: "none", cursor: "pointer",
                  fontFamily: "system-ui", fontSize: 13, fontWeight: 500,
                  background: lang === code ? "#f5f5f7" : "white",
                  color: "#333",
                  borderBottom: code === "pt" ? "1px solid #f0f0f0" : "none",
                }}
              >
                <span style={{ fontSize: 18 }}>{flag}</span> {label}
                {lang === code && <span style={{ marginLeft: "auto", fontSize: 11 }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <JewelCaseWrapper playlist={playlist} playlistId={playlistId} lang={lang} />
    </>
  );
}
