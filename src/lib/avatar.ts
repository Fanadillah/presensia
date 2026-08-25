import sharp from 'sharp';

/**
 * Kompres avatar 400x400 square, q70 mozjpeg.
 * Hemat storage: ~20-40KB per avatar vs 200KB+ original.
 */
export async function processAvatar(input: Buffer): Promise<Buffer> {
  return await sharp(input)
    .rotate()
    .resize(400, 400, { fit: 'cover', position: 'centre', withoutEnlargement: false })
    .jpeg({ quality: 70, mozjpeg: true, chromaSubsampling: '4:2:0' })
    .toBuffer();
}

/**
 * Ekstrak public_id Cloudinary dari secure_url.
 * Contoh: https://res.cloudinary.com/demo/image/upload/v123/avatars/abc123.jpg -> avatars/abc123
 * Return null jika bukan URL Cloudinary.
 */
export function extractPublicId(url: string | null | undefined): string | null {
  if (!url || !url.includes('cloudinary.com')) return null;
  try {
    const u = new URL(url);
    // pathname: /demo/image/upload/v123/avatars/abc123.jpg
    const parts = u.pathname.split('/');
    const uploadIdx = parts.indexOf('upload');
    if (uploadIdx === -1) return null;
    // setelah upload ada v123 lalu public_id
    let start = uploadIdx + 1;
    if (parts[start]?.startsWith('v')) start += 1;
    const publicWithExt = parts.slice(start).join('/');
    if (!publicWithExt) return null;
    // hilangkan ekstensi .jpg/.png
    return publicWithExt.replace(/\.[^.]+$/, '');
  } catch {
    return null;
  }
}
