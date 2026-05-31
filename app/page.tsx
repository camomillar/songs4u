"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import QRShare from "@/components/QRShare";
import { encodePlaylist, type Song } from "@/lib/encode";
import { compressImage } from "@/lib/compress";

const F = "system-ui, -apple-system, sans-serif";

const T = {
  en: {
    subtitle: "Choose songs, write a message and share the love!",
    details: "Details", to: "From", from: "To", toPlaceholder: "your name", fromPlaceholder: "their name",
    message: "Message", messagePlaceholder: "write your message...",
    bgColour: "Background colour", bgVibe: "Background vibe",
    hearts: "Hearts", stars: "Stars", music: "Music", flowers: "Flowers", kisses: "Kisses", none: "None",
    coverPhoto: "Cover photo", coverDesc: "This photo will appear on your cd cover",
    uploadPhoto: "Upload photo", changePhoto: "Change photo", remove: "Remove",
    addSongs: "Add songs", searchPlaceholder: "Search for a song or artist...",
    searching: "Searching...", yourSongs: "Your songs",
    generate: "Generate Link & QR Code",
    addName: "Add a name to continue", addSong: "Add at least one song to continue",
    alertName: "Please enter who this is for!", alertSong: "Add at least one song!",
    alertError: "Could not generate link. Please try again.",
    madeWith: "made with ♥ by",
  },
  pt: {
    subtitle: "Escolha músicas, escreva uma mensagem\ne compartilhe o amor!",
    details: "Detalhes", to: "De", from: "Para", toPlaceholder: "seu nome", fromPlaceholder: "quem vai receber",
    message: "Mensagem", messagePlaceholder: "escreva sua mensagem...",
    bgColour: "Cor de fundo", bgVibe: "Vibe do fundo",
    hearts: "Corações", stars: "Estrelas", music: "Música", flowers: "Flores", kisses: "Beijos", none: "Nenhum",
    coverPhoto: "Foto da capa", coverDesc: "Esta foto vai aparecer na capa do CD",
    uploadPhoto: "Enviar foto", changePhoto: "Trocar foto", remove: "Remover",
    addSongs: "Adicionar músicas", searchPlaceholder: "Busque por uma música ou artista...",
    searching: "Buscando...", yourSongs: "Suas músicas",
    generate: "Gerar Link & QR Code",
    addName: "Adicione um nome para continuar", addSong: "Adicione pelo menos uma música para continuar",
    alertName: "Por favor, insira para quem é a playlist!", alertSong: "Adicione pelo menos uma música!",
    alertError: "Não foi possível gerar o link. Tente novamente.",
    madeWith: "feito com ♥ por",
  },
};

const card: React.CSSProperties = {
  background: "white",
  borderRadius: 16,
  padding: "20px 20px",
  boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
  marginBottom: 16,
};

const label: React.CSSProperties = {
  fontFamily: F,
  fontSize: 11,
  fontWeight: 600,
  color: "#888",
  letterSpacing: 0.5,
  textTransform: "uppercase" as const,
  display: "block",
  marginBottom: 6,
};

const input: React.CSSProperties = {
  fontFamily: F,
  fontSize: 14,
  color: "#111",
  background: "#f7f7f8",
  border: "1px solid #e8e8ea",
  borderRadius: 10,
  padding: "10px 14px",
  width: "100%",
  outline: "none",
};

const sectionTitle: React.CSSProperties = {
  fontFamily: F,
  fontSize: 13,
  fontWeight: 700,
  color: "#111",
  marginBottom: 16,
};

export default function Home() {
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; title: string; artist: string; albumArt: string; previewUrl?: string | null }[]>([]);
  const [searching, setSearching] = useState(false);

  const [lang, setLang] = useState<"en" | "pt">("pt");
  const [langOpen, setLangOpen] = useState(false);
  const t = T[lang];
  const [bgColor, setBgColor] = useState("#FFB3C6");
  const [particles, setParticles] = useState<"hearts" | "stars" | "notes" | "flowers" | "none">("hearts");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const PASTEL_COLOURS = [
    { hex: "#C8102E", name: "Romantic Red" },
    { hex: "#FFB3C6", name: "Baby Pink" },
    { hex: "#FFCBA4", name: "Peach" },
    { hex: "#FFF176", name: "Yellow" },
    { hex: "#59FEB1", name: "Green" },
    { hex: "#0151C7", name: "Blue" },
    { hex: "#7B2FBE", name: "Purple" },
    { hex: "#F0F0F0", name: "Light Gray" },
  ];

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.tracks ?? []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  const handleAddSong = (track: { id: string; title: string; artist: string; albumArt: string; previewUrl?: string | null }) => {
    if (songs.find(s => s.id === track.id)) return;
    if (songs.length >= 11) return;
    setSongs(prev => [...prev, { ...track, previewUrl: track.previewUrl ?? undefined }]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveSong = (i: number) => setSongs(prev => prev.filter((_, idx) => idx !== i));

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverImage(await compressImage(file));
  };

  const handleGenerate = async () => {
    if (!to.trim()) { alert(t.alertName); return; }
    if (songs.length === 0) { alert(t.alertSong); return; }
    try {
      const res = await fetch("/api/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to.trim(), from: from.trim(), message: message.trim(), songs, bgColor, particles, ...(coverImage ? { coverImage } : {}) }),
      });
      const { id } = await res.json();
      setShareUrl(`${window.location.origin}/s/${id}`);
    } catch {
      alert(t.alertError);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
      {/* Language dropdown */}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 50 }}>
        <button
          onClick={() => setLangOpen(o => !o)}
          style={{
            fontFamily: "'Raleway', sans-serif", fontSize: 13, fontWeight: 600,
            background: "white", border: "1px solid #e0e0e0", borderRadius: 99,
            padding: "7px 14px", cursor: "pointer", color: "#444",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          {lang === "en" ? "🇺🇸" : "🇧🇷"} {lang === "en" ? "EN" : "PT"} <span style={{ fontSize: 10, color: "#aaa" }}>▾</span>
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
                  fontFamily: "'Raleway', sans-serif", fontSize: 13, fontWeight: 500,
                  background: lang === code ? "#f5f5f7" : "white",
                  color: "#333",
                  borderBottom: code === "pt" ? "1px solid #f0f0f0" : "none",
                }}
              >
                <span style={{ fontSize: 18 }}>{flag}</span> {label}
                {lang === code && <span style={{ marginLeft: "auto", color: "#111", fontSize: 11 }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 80px", position: "relative", zIndex: 1 }}>

        {/* Intro */}
        <div style={{
          textAlign: "center",
          padding: "48px 16px 28px",
          marginBottom: 12,
        }}>
          <p style={{
            fontFamily: "'BitcountGrid', monospace",
            fontSize: 38, fontWeight: 700, color: "#111",
            margin: "0 0 12px", lineHeight: 1.2,
          }}>
            songs4u &lt;3
          </p>
          <p style={{
            fontFamily: "'Raleway', sans-serif",
            fontSize: 13, fontWeight: 400, color: "#888",
            margin: 0, lineHeight: 1.6, whiteSpace: "pre-line",
          }}>
            {t.subtitle}
          </p>
        </div>

        {/* Details */}
        <div style={card}>
          <p style={sectionTitle}>{t.details}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <span style={label}>{t.to}</span>
              <input style={input} placeholder={t.toPlaceholder} value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <div>
              <span style={label}>{t.from}</span>
              <input style={input} placeholder={t.fromPlaceholder} value={from} onChange={e => setFrom(e.target.value)} />
            </div>
          </div>
          <span style={label}>{t.message}</span>
          <textarea
            style={{ ...input, resize: "none" as const, lineHeight: 1.6 }}
            placeholder={t.messagePlaceholder}
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            maxLength={60}
          />
          <p style={{ fontFamily: F, fontSize: 11, color: message.length > 50 ? "#e03050" : "#bbb", textAlign: "right", marginTop: 4 }}>
            {message.length}/60
          </p>
        </div>

        {/* Background colour */}
        <div style={card}>
          <p style={sectionTitle}>{t.bgColour}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "nowrap", justifyContent: "space-between" }}>
            {PASTEL_COLOURS.map(c => (
              <button key={c.hex} title={c.name} onClick={() => setBgColor(c.hex)} style={{
                width: 36, height: 36, minWidth: 36, borderRadius: "50%", background: c.hex, border: "none",
                outline: bgColor === c.hex ? "3px solid #111" : "3px solid transparent",
                outlineOffset: 2, cursor: "pointer", flexShrink: 0,
              }} />
            ))}
          </div>
        </div>

        {/* Background particles */}
        <div style={card}>
          <p style={sectionTitle}>{t.bgVibe}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {([
              { key: "hearts", label: t.hearts, emoji: "♥" },
              { key: "stars",  label: t.stars,  emoji: "✦" },
              { key: "notes",  label: t.music,  emoji: "♪" },
              { key: "flowers", label: t.flowers, emoji: "✿" },
            ] as const).map(({ key, label, emoji }) => (
              <button
                key={key}
                onClick={() => setParticles(key)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: particles === key ? "2px solid #111" : "2px solid #eee",
                  background: particles === key ? "#f5f5f7" : "white",
                  cursor: "pointer",
                  fontFamily: F,
                  transition: "border 0.15s",
                }}
              >
                <span style={{ fontSize: 20 }}>{emoji}</span>
                <span style={{ fontSize: 11, color: "#666" }}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cover photo */}
        <div style={card}>
          <p style={sectionTitle}>{t.coverPhoto}</p>
          <p style={{ fontFamily: F, fontSize: 12, color: "#999", marginBottom: 14, lineHeight: 1.5 }}>
            {t.coverDesc}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {coverImage && (
              <Image src={coverImage} alt="Cover" width={64} height={64}
                style={{ borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "1px solid #eee" }} />
            )}
            <div style={{ flex: 1 }}>
              <label style={{ display: "block" }}>
                <div style={{
                  fontFamily: F, fontSize: 14, fontWeight: 500, color: "#111",
                  background: "#f0f0f2", borderRadius: 10, padding: "10px 16px",
                  cursor: "pointer", textAlign: "center",
                }}>
                  {coverImage ? t.changePhoto : t.uploadPhoto}
                </div>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverUpload} />
              </label>
              {coverImage && (
                <button onClick={() => setCoverImage(null)} style={{
                  fontFamily: F, fontSize: 12, color: "#aaa", background: "none",
                  border: "none", cursor: "pointer", marginTop: 6, display: "block", width: "100%",
                }}>{t.remove}</button>
              )}
            </div>
          </div>
        </div>

        {/* Search songs */}
        <div style={card}>
          <p style={sectionTitle}>{t.addSongs}</p>
          <input
            style={input}
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
          />
          {searching && <p style={{ fontFamily: F, fontSize: 12, color: "#999", marginTop: 8 }}>{t.searching}</p>}
          {searchResults.length > 0 && (
            <div style={{ marginTop: 10, borderRadius: 10, overflow: "hidden", border: "1px solid #eee" }}>
              {searchResults.map(track => (
                <div key={track.id} onClick={() => handleAddSong(track)} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", cursor: "pointer", background: "white",
                  borderBottom: "1px solid #f0f0f0",
                  transition: "background 0.1s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f7f7f8")}
                  onMouseLeave={e => (e.currentTarget.style.background = "white")}
                >
                  {track.albumArt && (
                    <Image src={track.albumArt} alt="" width={38} height={38} unoptimized
                      style={{ borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: "#111", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</p>
                    <p style={{ fontFamily: F, fontSize: 12, color: "#888", margin: 0 }}>{track.artist}</p>
                  </div>
                  <span style={{ fontFamily: F, fontSize: 18, color: "#ccc", flexShrink: 0 }}>+</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Song list */}
        {songs.length > 0 && (
          <div style={card}>
            <p style={sectionTitle}>{t.yourSongs} ({songs.length}/11)</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {songs.map((song, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < songs.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                  {song.albumArt && (
                    <Image src={song.albumArt} alt="" width={36} height={36} unoptimized
                      style={{ borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: "#111", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</p>
                    <p style={{ fontFamily: F, fontSize: 12, color: "#888", margin: 0 }}>{song.artist}</p>
                  </div>
                  <button onClick={() => handleRemoveSong(i)} style={{
                    fontFamily: F, fontSize: 12, color: "#bbb", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", flexShrink: 0,
                  }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generate */}
        <button
          onClick={handleGenerate}
          disabled={songs.length === 0 || !to.trim()}
          style={{
            width: "100%", fontFamily: F, fontSize: 15, fontWeight: 600,
            background: songs.length > 0 && to.trim() ? "#111" : "#ddd",
            color: songs.length > 0 && to.trim() ? "white" : "#999",
            border: "none", borderRadius: 14, padding: "16px",
            cursor: songs.length > 0 && to.trim() ? "pointer" : "not-allowed",
          }}
        >
          {t.generate}
        </button>
        {(songs.length === 0 || !to.trim()) && (
          <p style={{ fontFamily: F, fontSize: 12, color: "#bbb", textAlign: "center", marginTop: 8 }}>
            {!to.trim() ? t.addName : t.addSong}
          </p>
        )}
      </div>

      {shareUrl && <QRShare url={shareUrl} onClose={() => setShareUrl(null)} />}

      {/* Footer */}
      <p style={{
        fontFamily: F, fontSize: 11, color: "#555",
        textAlign: "center", padding: "16px 0 32px",
      }}>
        {t.madeWith}{" "}
        <a href="https://www.instagram.com/caahmills/" target="_blank" rel="noopener noreferrer"
          style={{ color: "#444", textDecoration: "none", borderBottom: "1px solid #aaa" }}>
          caahmills
        </a>
      </p>
    </div>
  );
}
