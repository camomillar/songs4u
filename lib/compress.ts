/**
 * Compress an image to a tiny base64 JPEG for embedding in share URLs.
 * Target: 60×60px, quality 0.3 — roughly 1–3KB base64 (~1-4KB in URL).
 * The image only needs to be recognisable on the CD cover, not hi-res.
 */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new window.Image();
      img.onerror = reject;
      img.onload = () => {
        // Crop to a square first (center crop), then resize to 60x60
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        const canvas = document.createElement("canvas");
        canvas.width = 60;
        canvas.height = 60;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 60, 60);
        resolve(canvas.toDataURL("image/jpeg", 0.3));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
