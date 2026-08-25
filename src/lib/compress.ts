'use client';

/**
 * Client-side helper kompres foto sebelum upload.
 * Menurunkan bandwidth HP + mempercepat upload, complement server sharp q70.
 * Tidak mengganti kualitas akhir server — server tetap sharp resize 720/q70 final.
 */

export async function compressBlob(
  blob: Blob,
  maxWidth = 1024,
  quality = 0.75
): Promise<Blob> {
  // Jika sudah kecil (< 200KB) skip
  if (blob.size < 200 * 1024) return blob;

  const bitmap = await createImageBitmap(blob);
  const { width: w, height: h } = bitmap;
  if (w <= maxWidth && h <= maxWidth) {
    bitmap.close();
    return blob;
  }

  const scale = Math.min(maxWidth / w, maxWidth / h);
  const nw = Math.round(w * scale);
  const nh = Math.round(h * scale);

  const canvas = document.createElement('canvas');
  canvas.width = nw;
  canvas.height = nh;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return blob;
  }
  ctx.drawImage(bitmap, 0, 0, nw, nh);
  bitmap.close();

  const out: Blob | null = await new Promise((res) =>
    canvas.toBlob((b) => res(b), 'image/jpeg', quality)
  );
  return out ?? blob;
}
