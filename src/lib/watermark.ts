import sharp from 'sharp';
import { BRANDING } from './branding';
import { PHOTO_JPEG_QUALITY, PHOTO_MAX_WIDTH } from './constants';

export interface WatermarkInfo {
  recordedAt: Date;
  latitude: number;
  longitude: number;
  accuracy?: number;
  withinGeofence: boolean;
  geofenceName?: string | null;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Beri stempel pada foto selfie: tanggal-jam, koordinat GPS, dan status area.
 * Stempel menyatu dengan gambar sehingga sulit dipalsukan/dipisahkan.
 */
export async function addAttendanceWatermark(
  input: Buffer,
  info: WatermarkInfo
): Promise<Buffer> {
  try {
    const maxWidth = Number(process.env.PHOTO_MAX_WIDTH) || PHOTO_MAX_WIDTH;
    const jpegQuality = Number(process.env.PHOTO_JPEG_QUALITY) || PHOTO_JPEG_QUALITY;

    // Hitung dimensi target (Opsi A: 720p) agar watermark presisi + hemat storage
    const origMeta = await sharp(input).metadata();
    const oW = origMeta.width ?? maxWidth;
    const oH = origMeta.height ?? Math.round(maxWidth * 1.6);
    const orientation = origMeta.orientation ?? 1;
    // Jika EXIF rotate 90/270, width/height tertukar — sharp rotate() akan betulkan, estimasi konservatif:
    const isRotated = orientation >= 5 && orientation <= 8;
    const w = isRotated ? oH : oW;
    const h = isRotated ? oW : oH;
    const scale = w > maxWidth ? maxWidth / w : 1;
    const width = Math.round(w * scale);
    const height = Math.round(h * scale);

    const img = sharp(input).rotate().resize({
      width,
      height,
      fit: 'inside',
      withoutEnlargement: true,
    });

    const pad = Math.round(width * 0.04);
    const fontSize = Math.max(16, Math.round(width * 0.034));
    const lineHeight = Math.round(fontSize * 1.45);
    const lines = 4;
    const blockH = lines * lineHeight + pad;
    const y0 = height - blockH;

    const t = info.recordedAt;
    const dateStr = `${String(t.getDate()).padStart(2, '0')}/${String(
      t.getMonth() + 1
    ).padStart(2, '0')}/${t.getFullYear()} ${String(t.getHours()).padStart(2, '0')}:${String(
      t.getMinutes()
    ).padStart(2, '0')}`;
    const coordStr = `${info.latitude.toFixed(6)}, ${info.longitude.toFixed(6)}`;
    const accStr = info.accuracy ? ` (+/-${Math.round(info.accuracy)}m)` : '';
    const areaStr = info.withinGeofence
      ? `DI DALAM AREA${info.geofenceName ? ` - ${info.geofenceName}` : ''}`
      : 'DI LUAR AREA KANTOR';

    const textLines = [dateStr, coordStr + accStr, areaStr, BRANDING.name];
    const tspans = textLines
      .map(
        (line, i) =>
          `<text x="${pad}" y="${y0 + pad + lineHeight * (i + 1) - Math.round(
            lineHeight * 0.25
          )}" font-family="'DejaVu Sans','Liberation Sans',Arial,sans-serif" font-size="${fontSize}" font-weight="${
            i === 2 ? '700' : '600'
          }" fill="#ffffff" stroke="#000000" stroke-width="0.6" paint-order="stroke">${escapeXml(line)}</text>`
      )
      .join('');

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="${y0}" width="${width}" height="${blockH}" fill="rgba(0,0,0,0.55)"/>
      ${tspans}
    </svg>`;

    // Kompresi mozjpeg q70 (Opsi A) — hemat 60-70% vs q85 tanpa blur wajah
    const out = await img
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .jpeg({ quality: jpegQuality, mozjpeg: true, chromaSubsampling: '4:2:0' })
      .toBuffer();

    // Jika masih > 300KB (jarang), re-kompres agresif ke q60
    if (out.length > 300 * 1024 && jpegQuality > 60) {
      return await sharp(out).jpeg({ quality: 60, mozjpeg: true }).toBuffer();
    }
    return out;
  } catch (err) {
    // Jika watermark gagal, kirim foto asli — absensi tidak boleh terblok
    console.error('Watermark error:', err);
    return input;
  }
}
