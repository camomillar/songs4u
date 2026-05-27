"use client";
import { useEffect, useState } from "react";
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


  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [myPlaylists, setMyPlaylists] = useState<{ id: string; name: string; image: string | null; total: number }[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
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

  useEffect(() => {
    fetch("/api/spotify/me")
      .then(r => { setIsAuthed(r.ok); setAuthChecked(true); })
      .catch(() => setAuthChecked(true));
  }, []);

  // Load user's playlists once authenticated
  useEffect(() => {
    if (!isAuthed) return;
    setPlaylistsLoading(true);
    fetch("/api/spotify/user-playlists")
      .then(r => r.json())
      .then(d => setMyPlaylists(d.playlists ?? []))
      .catch(() => {})
      .finally(() => setPlaylistsLoading(false));
  }, [isAuthed]);

  const handleSelectPlaylist = async (id: string) => {
    setSelectedPlaylistId(id);
    setFetching(true);
    setFetchError("");
    setSongs([]);
    try {
      const res = await fetch(`/api/playlist-tracks?id=${id}`);
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

        {/* Spotify playlist picker */}
        <div className="pixel-card" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 9, marginBottom: 16, color: "var(--accent2)" }}>♪ Pick a Playlist</p>
          {playlistsLoading ? (
            <p style={{ fontSize: 7, color: "var(--text2)" }}>Loading your playlists<span className="loading-dots" /></p>
          ) : (
            <ul className="pixel-list" style={{ maxHeight: 280, overflowY: "auto", gap: 2 }}>
              {myPlaylists.map(pl => (
                <li
                  key={pl.id}
                  className={`pixel-list-item ${selectedPlaylistId === pl.id ? "active" : ""}`}
                  onClick={() => handleSelectPlaylist(pl.id)}
                  style={{ gap: 10 }}
                >
                  {pl.image ? (
                    <Image src={pl.image} alt={pl.name} width={36} height={36} unoptimized
                      style={{ objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 36, height: 36, background: "var(--accent3)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>♪</div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pl.name}</p>
                    <p style={{ fontSize: 6, color: "var(--text2)", marginTop: 2 }}>{pl.total} songs</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {fetching && <p style={{ fontSize: 7, color: "var(--text2)", marginTop: 10 }}>Loading songs<span className="loading-dots" /></p>}
          {fetchError && <p style={{ fontSize: 7, color: "var(--accent2)", marginTop: 10 }}>⚠ {fetchError}</p>}
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
