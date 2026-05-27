"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import HeartParticles from "@/components/HeartParticles";
import QRShare from "@/components/QRShare";
import { encodePlaylist, type Song } from "@/lib/encode";

export default function Home() {
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);


  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; title: string; artist: string; albumArt: string }[]>([]);
  const [searching, setSearching] = useState(false);

  const [bgColor, setBgColor] = useState("#FFE4E8");

  const PASTEL_COLOURS = [
    { hex: "#FFE4E8", name: "Rose" },
    { hex: "#F3E4FF", name: "Lavender" },
    { hex: "#E4F0FF", name: "Sky" },
    { hex: "#E4FFF4", name: "Mint" },
    { hex: "#FFFBE4", name: "Butter" },
    { hex: "#FFE8D6", name: "Peach" },
    { hex: "#FFD6F0", name: "Pink" },
  ];

  const [shareUrl, setShareUrl] = useState<string | null>(null);


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

  const handleAddSearchResult = (track: { id: string; title: string; artist: string; albumArt: string }) => {
    if (songs.find(s => s.id === track.id)) return; // no duplicates
    setSongs(prev => [...prev, track]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveSong = (i: number) => setSongs((prev) => prev.filter((_, idx) => idx !== i));

  const handleGenerate = () => {
    if (!to.trim()) { alert("Please enter who this is for!"); return; }
    if (songs.length === 0) { alert("Add at least one song!"); return; }
    const encoded = encodePlaylist({
      to: to.trim(), from: from.trim(), message: message.trim(), songs,
      bgColor,
    });
    setShareUrl(`${window.location.origin}/share?d=${encoded}`);
  };

  if (!authChecked) {
    return (
      <div className="app-wrapper"><HeartParticles />
        <div className="login-screen"><p style={{ fontSize: 8, color: "var(--text2)" }}>Loading<span className="loading-dots" /></p></div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="app-wrapper">
        <HeartParticles />
        <div className="login-screen">
          <div className="pixel-card login-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>♥</div>
            <h1 style={{ fontSize: 15, marginBottom: 8, textShadow: "2px 2px 0 var(--accent)" }}>Lovelist</h1>
            <p style={{ fontSize: 8, color: "var(--text2)", marginBottom: 24, lineHeight: 2 }}>
              make a playlist for someone special
            </p>
            <form action="/api/auth/login" method="GET" style={{ width: "100%" }}>
              <button type="submit" className="pixel-btn green large" style={{ width: "100%" }}>
                Login with Spotify ♥
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <HeartParticles />
      <div className="page-content">

        <div className="app-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span className="app-title">♥ Lovelist ♥</span>
            <span className="app-subtitle" style={{ display: "block" }}>make a playlist for someone special</span>
          </div>
          <form action="/api/auth/logout" method="GET">
            <button type="submit" className="pixel-btn" style={{ fontSize: 7, padding: "6px 10px" }}>Logout</button>
          </form>
        </div>

        {/* Details */}
        <div className="pixel-card" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 9, marginBottom: 16, color: "var(--accent2)" }}>♥ The Details</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label className="pixel-label">FOR</label>
              <input className="pixel-input" placeholder="their name..." value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div>
              <label className="pixel-label">FROM</label>
              <input className="pixel-input" placeholder="your name..." value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
          </div>
          <label className="pixel-label">YOUR MESSAGE</label>
          <textarea
            className="pixel-input" placeholder="write something sweet..."
            value={message} onChange={(e) => setMessage(e.target.value)}
            rows={3} maxLength={80} style={{ resize: "none" }}
          />
          <p style={{ fontSize: 7, color: message.length > 70 ? "var(--accent2)" : "var(--text2)", marginTop: 6, textAlign: "right" }}>
            {message.length}/80
          </p>
        </div>


        {/* Background colour */}
        <div className="pixel-card" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 9, marginBottom: 16, color: "var(--accent2)" }}>🎨 Background Colour</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {PASTEL_COLOURS.map((c) => (
              <button key={c.hex} title={c.name} onClick={() => setBgColor(c.hex)} style={{
                width: 40, height: 40, borderRadius: "50%", background: c.hex,
                border: bgColor === c.hex ? "3px solid var(--text)" : "3px solid transparent",
                boxShadow: bgColor === c.hex ? "2px 2px 0 var(--shadow)" : "none",
                cursor: "pointer", outline: "none", position: "relative",
              }}>
                {bgColor === c.hex && (
                  <span style={{ fontSize: 14, position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</span>
                )}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 7, color: "var(--text2)", marginTop: 10 }}>
            Selected: {PASTEL_COLOURS.find(c => c.hex === bgColor)?.name}
          </p>
        </div>

        {/* Song search */}
        <div className="pixel-card" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 9, marginBottom: 16, color: "var(--accent2)" }}>♪ Add Songs</p>
          <label className="pixel-label">SEARCH SPOTIFY</label>
          <input
            className="pixel-input"
            placeholder="Search for a song or artist..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            style={{ marginBottom: searching ? 8 : searchResults.length ? 8 : 0 }}
          />
          {searching && <p style={{ fontSize: 7, color: "var(--text2)", marginBottom: 8 }}>Searching<span className="loading-dots" /></p>}
          {searchResults.length > 0 && (
            <ul className="pixel-list" style={{ gap: 2 }}>
              {searchResults.map(track => (
                <li key={track.id} className="pixel-list-item" onClick={() => handleAddSearchResult(track)} style={{ gap: 10 }}>
                  <Image src={track.albumArt} alt={track.title} width={36} height={36} unoptimized
                    style={{ objectFit: "cover", flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</p>
                    <p style={{ fontSize: 6, color: "var(--text2)", marginTop: 2 }}>{track.artist}</p>
                  </div>
                  <span style={{ fontSize: 14, color: "var(--accent3)", flexShrink: 0 }}>+</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Song list */}
        {songs.length > 0 && (
          <div className="pixel-card" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 9, marginBottom: 14, color: "var(--accent2)" }}>♪ Songs ({songs.length})</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {songs.map((song, i) => (
                <div key={i} className="song-row">
                  {song.albumArt && (
                    <Image src={song.albumArt} alt="" width={36} height={36} unoptimized
                      style={{ borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</p>
                    {song.artist && <p style={{ fontSize: 7, color: "var(--text2)", marginTop: 2 }}>{song.artist}</p>}
                  </div>
                  <button className="pixel-btn ghost" onClick={() => handleRemoveSong(i)}
                    style={{ fontSize: 12, padding: "4px 8px", flexShrink: 0 }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generate */}
        <button className="pixel-btn" onClick={handleGenerate}
          disabled={songs.length === 0 || !to.trim()}
          style={{ width: "100%", fontSize: 11, padding: "16px", marginBottom: 8 }}>
          ♥ Generate Link &amp; QR Code
        </button>
        {(songs.length === 0 || !to.trim()) && (
          <p style={{ fontSize: 7, color: "var(--text2)", textAlign: "center" }}>
            {!to.trim() ? "Add a name above to continue" : "Search and add at least one song to continue"}
          </p>
        )}
      </div>

      {shareUrl && <QRShare url={shareUrl} onClose={() => setShareUrl(null)} />}
    </div>
  );
}
