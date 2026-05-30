"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ValentinesPlaylist } from "@/lib/encode";
import SharePageContent from "@/components/SharePageContent";

export default function ShortLinkPage() {
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<ValentinesPlaylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/playlist?id=${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setPlaylist(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
      <p style={{ fontFamily: "system-ui", fontSize: 14, color: "#999" }}>Loading...</p>
    </div>
  );

  if (error || !playlist) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
      <p style={{ fontFamily: "system-ui", fontSize: 14, color: "#999" }}>Playlist not found.</p>
    </div>
  );

  return <SharePageContent playlist={playlist} playlistId={id} />;
}
