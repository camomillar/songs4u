"use client";
import Image from "next/image";

export interface Playlist {
  id: string;
  name: string;
  uri: string;
  images: { url: string }[];
  tracks: { total: number };
  type: "playlist" | "liked";
}

interface Props {
  playlists: Playlist[];
  activeId: string | null;
  onSelect: (p: Playlist) => void;
  loading: boolean;
}

export default function PlaylistSidebar({ playlists, activeId, onSelect, loading }: Props) {
  return (
    <aside>
      <div className="pixel-card" style={{ height: "100%", minHeight: 400 }}>
        <p style={{ fontSize: 8, color: "var(--text2)", marginBottom: 12, letterSpacing: 1 }}>
          YOUR PLAYLISTS
        </p>

        {loading ? (
          <p style={{ fontSize: 8, color: "var(--text2)" }}>
            Loading<span className="loading-dots" />
          </p>
        ) : (
          <ul className="pixel-list" style={{ maxHeight: 520, overflowY: "auto" }}>
            {playlists.map((pl) => (
              <li
                key={pl.id}
                className={`pixel-list-item ${activeId === pl.id ? "active" : ""}`}
                onClick={() => onSelect(pl)}
              >
                <div style={{ flexShrink: 0 }}>
                  {pl.images[0] ? (
                    <Image
                      src={pl.images[0].url}
                      alt={pl.name}
                      width={32}
                      height={32}
                      className="album-art"
                      style={{ width: 32, height: 32, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        background: "var(--accent)",
                        border: "2px solid var(--text)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                      }}
                    >
                      {pl.type === "liked" ? "♥" : "♪"}
                    </div>
                  )}
                </div>
                <div style={{ overflow: "hidden", minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 7,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {pl.name}
                  </p>
                  <p style={{ fontSize: 6, color: "var(--text2)", marginTop: 2 }}>
                    {pl.tracks.total} songs
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
