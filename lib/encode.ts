export interface Song {
  id: string;         // Spotify track ID
  title: string;
  artist: string;
  albumArt?: string;  // Spotify album art URL
  previewUrl?: string; // 30s preview MP3 URL (fetched at build time)
}

export interface ValentinesPlaylist {
  to: string;
  from: string;
  message: string;
  songs: Song[];
  coverImage?: string; // base64 compressed photo
  bgColor?: string;    // pastel background colour
}

export function encodePlaylist(playlist: ValentinesPlaylist): string {
  return btoa(encodeURIComponent(JSON.stringify(playlist)));
}

export function decodePlaylist(encoded: string): ValentinesPlaylist | null {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)));
  } catch {
    return null;
  }
}
