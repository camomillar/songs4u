"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import HeartParticles from "@/components/HeartParticles";
import QRShare from "@/components/QRShare";
import { extractVideoId, getThumbnail } from "@/lib/youtube";
import { encodePlaylist, type Song } from "@/lib/encode";

export default function Home() {
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);

  // Add song form
  const [ytUrl, setYtUrl] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [urlError, setUrlError] = useState("");

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const handleUrlChange = (val: string) => {
    setYtUrl(val);
    setUrlError("");
    const id = extractVideoId(val);
    setPreviewId(id);
  };

  const handleAddSong = () => {
    const id = extractVideoId(ytUrl);
    if (!id) { setUrlError("Couldn't find a YouTube video ID in that URL."); return; }
    if (!songTitle.trim()) { setUrlError("Please enter a song title."); return; }
    setSongs((prev) => [...prev, { id, title: songTitle.trim(), artist: songArtist.trim() }]);
    setYtUrl(""); setSongTitle(""); setSongArtist(""); setPreviewId(null); setUrlError("");
    urlInputRef.current?.focus();
  };

  const handleRemoveSong = (index: number) => {
    setSongs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = () => {
    if (!to.trim()) { alert("Please enter who this is for!"); return; }
    if (songs.length === 0) { alert("Add at least one song!"); return; }
    const encoded = encodePlaylist({ to: to.trim(), from: from.trim(), message: message.trim(), songs });
    const url = `${window.location.origin}/share?d=${encoded}`;
    setShareUrl(url);
  };

  return (
    <div className="app-wrapper">
      <HeartParticles />

      <div className="page-content">
        {/* Header */}
        <div className="app-header">
          <span className="app-title">♥ Lovelist ♥</span>
          <span className="app-subtitle">make a playlist for someone special</span>
        </div>

        {/* Who is it for */}
        <div className="pixel-card" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 9, marginBottom: 16, color: "var(--accent2)" }}>
            ♥ The Details
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label className="pixel-label">FOR</label>
              <input
                className="pixel-input"
                placeholder="their name..."
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div>
              <label className="pixel-label">FROM</label>
              <input
                className="pixel-input"
                placeholder="your name..."
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
          </div>
          <label className="pixel-label">YOUR MESSAGE</label>
          <textarea
            className="pixel-input"
            placeholder="write something sweet..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            style={{ resize: "none" }}
          />
        </div>

        {/* Add song */}
        <div className="pixel-card" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 9, marginBottom: 16, color: "var(--accent2)" }}>
            ♪ Add a Song
          </p>

          <label className="pixel-label">YOUTUBE LINK</label>
          <input
            ref={urlInputRef}
            className="pixel-input"
            placeholder="https://youtube.com/watch?v=..."
            value={ytUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            style={{ marginBottom: 12 }}
          />

          {previewId && (
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, padding: "8px", background: "var(--bg2)", border: "2px solid var(--accent3)" }}>
              <Image
                src={getThumbnail(previewId)}
                alt="thumbnail"
                width={80}
                height={45}
                unoptimized
                style={{ border: "2px solid var(--text)", flexShrink: 0 }}
              />
              <p style={{ fontSize: 7, color: "var(--text2)" }}>✓ Video found!</p>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label className="pixel-label">SONG TITLE</label>
              <input className="pixel-input" placeholder="title..." value={songTitle} onChange={(e) => setSongTitle(e.target.value)} />
            </div>
            <div>
              <label className="pixel-label">ARTIST</label>
              <input className="pixel-input" placeholder="artist..." value={songArtist} onChange={(e) => setSongArtist(e.target.value)} />
            </div>
          </div>

          {urlError && (
            <p style={{ fontSize: 7, color: "var(--accent2)", marginBottom: 10 }}>⚠ {urlError}</p>
          )}

          <button
            className="pixel-btn"
            onClick={handleAddSong}
            disabled={!ytUrl || !songTitle}
            style={{ width: "100%" }}
          >
            + Add Song
          </button>
        </div>

        {/* Song list */}
        {songs.length > 0 && (
          <div className="pixel-card" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 9, marginBottom: 14, color: "var(--accent2)" }}>
              ♪ Your Songs ({songs.length})
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {songs.map((song, i) => (
                <div key={i} className="song-row">
                  <Image
                    src={getThumbnail(song.id)}
                    alt={song.title}
                    width={60}
                    height={34}
                    unoptimized
                    style={{ border: "2px solid var(--text)", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {song.title}
                    </p>
                    {song.artist && (
                      <p style={{ fontSize: 7, color: "var(--text2)", marginTop: 2 }}>{song.artist}</p>
                    )}
                  </div>
                  <button
                    className="pixel-btn ghost"
                    onClick={() => handleRemoveSong(i)}
                    style={{ fontSize: 12, padding: "4px 8px", flexShrink: 0 }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generate button */}
        <button
          className="pixel-btn"
          onClick={handleGenerate}
          disabled={songs.length === 0 || !to.trim()}
          style={{ width: "100%", fontSize: 11, padding: "16px", marginBottom: 8 }}
        >
          ♥ Generate Link &amp; QR Code
        </button>
        {(songs.length === 0 || !to.trim()) && (
          <p style={{ fontSize: 7, color: "var(--text2)", textAlign: "center" }}>
            {!to.trim() ? "Add a name above to continue" : "Add at least one song to continue"}
          </p>
        )}
      </div>

      {/* QR Modal */}
      {shareUrl && <QRShare url={shareUrl} onClose={() => setShareUrl(null)} />}
    </div>
  );
}
