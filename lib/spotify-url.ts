/** Extract Spotify track ID from a share URL */
export function extractSpotifyId(url: string): string | null {
  const match = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/** Spotify embed URL for a track (compact 80px player) */
export function getSpotifyEmbed(trackId: string): string {
  return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`;
}
