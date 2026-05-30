/**
 * Compress an image to base64 JPEG for the CD cover.
 * 600×600px at 0.92 quality — high quality cover art.
 */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new window.Image();
      img.onerror = reject;
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 600;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 600, 600);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
