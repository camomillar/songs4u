export interface Song {
  id: string;    // YouTube video ID
  title: string;
  artist: string;
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
