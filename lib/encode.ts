import LZString from "lz-string";

export interface Song {
  id: string;         // Spotify track ID
  title: string;
  artist: string;
  albumArt?: string;  // Spotify album art URL
  previewUrl?: string;
}

export interface ValentinesPlaylist {
  to: string;
  from: string;
  message: string;
  songs: Song[];
  coverImage?: string;
  bgColor?: string;
}

export function encodePlaylist(playlist: ValentinesPlaylist): string {
  // Compress with lz-string — ~60-70% shorter than plain base64
  return LZString.compressToEncodedURIComponent(JSON.stringify(playlist));
}

export function decodePlaylist(encoded: string): ValentinesPlaylist | null {
  try {
    // Try new compressed format first
    const compressed = LZString.decompressFromEncodedURIComponent(encoded);
    if (compressed) return JSON.parse(compressed);

    // Fall back to old base64 format (for existing links)
    return JSON.parse(decodeURIComponent(atob(encoded)));
  } catch {
    return null;
  }
}
