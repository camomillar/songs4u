"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import HeartParticles from "@/components/HeartParticles";
import QRShare from "@/components/QRShare";
import { encodePlaylist, type Song } from "@/lib/encode";
import { compressImage } from "@/lib/compress";

const F = "system-ui, -apple-system, sans-serif";

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
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; title: string; artist: string; albumArt: string }[]>([]);
  const [searching, setSearching] = useState(false);

  const [bgColor, setBgColor] = useState("#FFE4E8");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const PASTEL_COLOURS = [
    { hex: "#FFE4E8", name: "Rose" },
    { hex: "#F3E4FF", name: "Lavender" },
    { hex: "#E4F0FF", name: "Sky" },
    { hex: "#E4FFF4", name: "Mint" },
    { hex: "#FFFBE4", name: "Butter" },
    { hex: "#FFE8D6", name: "Peach" },
    { hex: "#FFD6F0", name: "Pink" },
  ];

  useEffect(() => {
    fetch("/api/spotify/me")
      .then(r => { setIsAuthed(r.ok); setAuthChecked(true); })
      .catch(() => setAuthChecked(true));
  }, []);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.tracks ?? []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  const handleAddSong = (track: { id: string; title: string; artist: string; albumArt: string }) => {
    if (songs.find(s => s.id === track.id)) return;
    setSongs(prev => [...prev, track]);
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
    if (!to.trim()) { alert("Please enter who this is for!"); return; }
    if (songs.length === 0) { alert("Add at least one song!"); return; }
    try {
      const res = await fetch("/api/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to.trim(), from: from.trim(), message: message.trim(), songs, bgColor, ...(coverImage ? { coverImage } : {}) }),
      });
      const { id } = await res.json();
      setShareUrl(`${window.location.origin}/s/${id}`);
    } catch {
      alert("Could not generate link. Please try again.");
    }
  };

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <HeartParticles />
        <p style={{ fontFamily: F, fontSize: 14, color: "#999" }}>Loading...</p>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div style={{ minHeight: "100vh", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <HeartParticles />
        <div style={{ textAlign: "center", maxWidth: 320, padding: 24 }}>
          <p style={{ fontFamily: "'OrdinaryLetter', cursive", fontSize: 36, marginBottom: 8, color: "#111" }}>songs4u</p>
          <p style={{ fontFamily: F, fontSize: 14, color: "#888", marginBottom: 32, lineHeight: 1.6 }}>
            make a playlist for someone special
          </p>
          <form action="/api/auth/login" method="GET">
            <button type="submit" style={{
              fontFamily: F, fontSize: 15, fontWeight: 600,
              background: "#1DB954", color: "white", border: "none",
              borderRadius: 50, padding: "14px 32px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10, margin: "0 auto",
            }}>
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

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
      <HeartParticles />

      {/* Header */}
      <div style={{
        background: "white",
        borderBottom: "1px solid #eee",
        padding: "16px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 20,
        backdropFilter: "blur(8px)",
      }}>
        <p style={{ fontFamily: "'OrdinaryLetter', cursive", fontSize: 24, color: "#111", margin: 0 }}>songs4u</p>
        <form action="/api/auth/logout" method="GET">
          <button type="submit" style={{
            fontFamily: F, fontSize: 13, color: "#555",
            background: "#f0f0f2", border: "none", borderRadius: 20,
            padding: "6px 14px", cursor: "pointer",
          }}>Logout</button>
        </form>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 80px", position: "relative", zIndex: 1 }}>

        {/* Intro */}
        <div style={{
          textAlign: "center",
          padding: "28px 16px 20px",
          marginBottom: 8,
        }}>
          <p style={{ fontFamily: "'OrdinaryLetter', cursive", fontSize: 34, color: "#111", margin: 0, lineHeight: 1.25 }}>
            make a playlist
          </p>
          <p style={{ fontFamily: "'OrdinaryLetter', cursive", fontSize: 34, color: "#e03050", margin: "0 0 10px", lineHeight: 1.25 }}>
            for someone special
          </p>
          <p style={{ fontFamily: F, fontSize: 13, color: "#aaa", margin: 0, letterSpacing: 0.3 }}>
            choose songs · write a message · share the love
          </p>
        </div>

        {/* Details */}
        <div style={card}>
          <p style={sectionTitle}>Details</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <span style={label}>To</span>
              <input style={input} placeholder="their name" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <div>
              <span style={label}>From</span>
              <input style={input} placeholder="your name" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
          </div>
          <span style={label}>Message</span>
          <textarea
            style={{ ...input, resize: "none" as const, lineHeight: 1.6 }}
            placeholder="write your message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            maxLength={30}
          />
          <p style={{ fontFamily: F, fontSize: 11, color: message.length > 24 ? "#e03050" : "#bbb", textAlign: "right", marginTop: 4 }}>
            {message.length}/30
          </p>
        </div>

        {/* Background colour */}
        <div style={card}>
          <p style={sectionTitle}>Background colour</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {PASTEL_COLOURS.map(c => (
              <button key={c.hex} title={c.name} onClick={() => setBgColor(c.hex)} style={{
                width: 36, height: 36, borderRadius: "50%", background: c.hex, border: "none",
                outline: bgColor === c.hex ? "3px solid #111" : "3px solid transparent",
                outlineOffset: 2, cursor: "pointer",
              }} />
            ))}
          </div>
        </div>

        {/* Cover photo */}
        <div style={card}>
          <p style={sectionTitle}>Cover photo</p>
          <p style={{ fontFamily: F, fontSize: 12, color: "#999", marginBottom: 14, lineHeight: 1.5 }}>
            This photo will appear on the front of the closed CD case
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {coverImage ? (
              <Image src={coverImage} alt="Cover" width={64} height={64}
                style={{ borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "1px solid #eee" }} />
            ) : (
              <div style={{
                width: 64, height: 64, borderRadius: 10, background: "#f0f0f2",
                border: "1.5px dashed #ccc", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, color: "#ccc",
              }}>📷</div>
            )}
            <div style={{ flex: 1 }}>
              <label style={{ display: "block" }}>
                <div style={{
                  fontFamily: F, fontSize: 14, fontWeight: 500, color: "#111",
                  background: "#f0f0f2", borderRadius: 10, padding: "10px 16px",
                  cursor: "pointer", textAlign: "center",
                }}>
                  {coverImage ? "Change photo" : "Upload photo"}
                </div>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverUpload} />
              </label>
              {coverImage && (
                <button onClick={() => setCoverImage(null)} style={{
                  fontFamily: F, fontSize: 12, color: "#aaa", background: "none",
                  border: "none", cursor: "pointer", marginTop: 6, display: "block", width: "100%",
                }}>Remove</button>
              )}
            </div>
          </div>
        </div>

        {/* Search songs */}
        <div style={card}>
          <p style={sectionTitle}>Add songs</p>
          <input
            style={input}
            placeholder="Search for a song or artist..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
          />
          {searching && <p style={{ fontFamily: F, fontSize: 12, color: "#999", marginTop: 8 }}>Searching...</p>}
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
            <p style={sectionTitle}>Your songs ({songs.length})</p>
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
          Generate Link & QR Code
        </button>
        {(songs.length === 0 || !to.trim()) && (
          <p style={{ fontFamily: F, fontSize: 12, color: "#bbb", textAlign: "center", marginTop: 8 }}>
            {!to.trim() ? "Add a name to continue" : "Add at least one song to continue"}
          </p>
        )}
      </div>

      {shareUrl && <QRShare url={shareUrl} onClose={() => setShareUrl(null)} />}

      {/* Footer */}
      <p style={{
        fontFamily: F, fontSize: 11, color: "#555",
        textAlign: "center", padding: "16px 0 32px",
      }}>
        made with ♥ by{" "}
        <a href="https://www.instagram.com/caahmills/" target="_blank" rel="noopener noreferrer"
          style={{ color: "#444", textDecoration: "none", borderBottom: "1px solid #aaa" }}>
          caahmills
        </a>
      </p>
    </div>
  );
}
