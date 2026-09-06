// Downscales and re-encodes an image on the client before upload, so a
// straight-from-camera 4000x3000 photo doesn't tie up a phone's mobile data
// (or eat into the 2MB/5MB storage limits) for what's displayed at most as a
// few hundred pixels wide anywhere in the app. Skips files that are already
// small enough, and non-image files, rather than risking degrading them.
const SKIP_BELOW_BYTES = 300 * 1024;

export async function compressImage(
  file: File,
  { maxDimension, quality = 0.82 }: { maxDimension: number; quality?: number }
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.size < SKIP_BELOW_BYTES) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    // Any failure (unsupported format, decode error) — fall back to the
    // original file rather than blocking the upload.
    return file;
  }
}
