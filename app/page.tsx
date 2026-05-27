"use client";
import { useState } from "react";
import Image from "next/image";
import HeartParticles from "@/components/HeartParticles";
import QRShare from "@/components/QRShare";
import { encodePlaylist, type Song } from "@/lib/encode";
import { compressImage } from "@/lib/compress";

export default function Home() {
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);


  const [playlistUrl, setPlaylistUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const [coverImage, setCoverImage] = useState<string | null>(null);
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

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverImage(await compressImage(file));
  };

  const handleFetchPlaylist = async () => {
    if (!playlistUrl.trim()) return;
    setFetching(true);
    setFetchError("");
    try {
      const res = await fetch(`/api/playlist-tracks?url=${encodeURIComponent(playlistUrl)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSongs(data.songs);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Could not fetch playlist");
    } finally {
      setFetching(false);
    }
  };

  const handleRemoveSong = (i: number) => setSongs((prev) => prev.filter((_, idx) => idx !== i));

  const handleGenerate = () => {
    if (!to.trim()) { alert("Please enter who this is for!"); return; }
    if (songs.length === 0) { alert("Add at least one song!"); return; }
    const encoded = encodePlaylist({
      to: to.trim(), from: from.trim(), message: message.trim(), songs,
      ...(coverImage ? { coverImage } : {}),
      bgColor,
    });
    setShareUrl(`${window.location.origin}/share?d=${encoded}`);
  };

  return (
    <div className="app-wrapper">
      <HeartParticles />
      <div className="page-content">

        <div className="app-header">
          <span className="app-title">♥ Lovelist ♥</span>
          <span className="app-subtitle">make a playlist for someone special</span>
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

        {/* Cover photo */}
        <div className="pixel-card" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 9, marginBottom: 16, color: "var(--accent2)" }}>📷 Cover Photo</p>
          <p style={{ fontSize: 7, color: "var(--text2)", marginBottom: 12, lineHeight: 2 }}>Appears on the CD cover</p>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {coverImage && (
              <Image src={coverImage} alt="Cover" width={72} height={72}
                style={{ borderRadius: "50%", border: "3px solid var(--text)", objectFit: "cover", flexShrink: 0 }} />
            )}
            <label style={{ flex: 1 }}>
              <div className="pixel-btn" style={{ width: "100%", cursor: "pointer" }}>
                {coverImage ? "Change photo" : "+ Upload photo"}
              </div>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverUpload} />
            </label>
            {coverImage && (
              <button className="pixel-btn ghost" style={{ fontSize: 10, padding: "6px 8px" }} onClick={() => setCoverImage(null)}>✕</button>
            )}
          </div>
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

        {/* Spotify playlist */}
        <div className="pixel-card" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 9, marginBottom: 16, color: "var(--accent2)" }}>♪ Spotify Playlist</p>
          <p style={{ fontSize: 7, color: "var(--text2)", lineHeight: 2, marginBottom: 12 }}>
            On Spotify: open your playlist → Share → Copy link to playlist
          </p>
          <label className="pixel-label">PLAYLIST LINK</label>
          <input
            className="pixel-input"
            placeholder="https://open.spotify.com/playlist/..."
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          {fetchError && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 7, color: "var(--accent2)", marginBottom: 8 }}>⚠ {fetchError}</p>
              {fetchError.includes("private") && (
                <a href={`/api/auth/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "/")}`}>
                  <button className="pixel-btn green" style={{ width: "100%", fontSize: 8 }}>
                    Login with Spotify to load private playlists
                  </button>
                </a>
              )}
            </div>
          )}
          <button
            className="pixel-btn"
            onClick={handleFetchPlaylist}
            disabled={!playlistUrl.trim() || fetching}
            style={{ width: "100%" }}
          >
            {fetching ? "Loading songs..." : "Load Songs from Spotify"}
          </button>
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
            {!to.trim() ? "Add a name above to continue" : "Load a playlist to continue"}
          </p>
        )}
      </div>

      {shareUrl && <QRShare url={shareUrl} onClose={() => setShareUrl(null)} />}
    </div>
  );
}
