import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const outDir = join(process.cwd(), 'public');

// SVG source for Presensia: P + Clock (option A)
// - Rounded square primary #2563eb
// - White "P" bold + small clock icon integrated
// Design is flat and readable at 32px, works for maskable with padding.
function svgIcon(size, maskable = false) {
  const pad = maskable ? size * 0.2 : 0;
  const bgSize = maskable ? size - pad * 2 : size;
  const bgX = maskable ? pad : 0;
  const bgY = maskable ? pad : 0;
  const r = Math.round(bgSize * 0.22);
  // Scale everything relative to 512 base
  const scale = size / 512;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.12}" fill="${maskable ? '#2563eb' : '#f8fafc'}"/>
  <rect x="${bgX}" y="${bgY}" width="${bgSize}" height="${bgSize}" rx="${r}" fill="#2563eb"/>
  <!-- P letter -->
  <text x="${size * 0.5}" y="${size * 0.48}" text-anchor="middle" dominant-baseline="central"
    font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="${Math.round(210 * scale)}" font-weight="800" fill="white" letter-spacing="-6">P</text>
  <!-- Clock circle at bottom-center of P bowl -->
  <g transform="translate(${size * 0.62}, ${size * 0.62})">
    <circle r="${Math.round(48 * scale)}" fill="white" opacity="0.96"/>
    <circle r="${Math.round(44 * scale)}" fill="none" stroke="#2563eb" stroke-width="${Math.round(6 * scale)}"/>
    <!-- clock hands: 10:10 style -->
    <line x1="0" y1="0" x2="0" y2="${-Math.round(22 * scale)}" stroke="#2563eb" stroke-width="${Math.round(6 * scale)}" stroke-linecap="round"/>
    <line x1="0" y1="0" x2="${Math.round(16 * scale)}" y2="${Math.round(10 * scale)}" stroke="#2563eb" stroke-width="${Math.round(6 * scale)}" stroke-linecap="round"/>
    <circle r="${Math.round(6 * scale)}" fill="#2563eb"/>
  </g>
</svg>`;
}

async function gen() {
  const targets = [
    { file: 'icon-192.png', size: 192, maskable: false },
    { file: 'icon-512.png', size: 512, maskable: false },
    { file: 'icon-512-maskable.png', size: 512, maskable: true },
    { file: 'apple-touch-icon.png', size: 180, maskable: false },
    { file: 'favicon-32x32.png', size: 32, maskable: false },
    { file: 'icon-source.svg', size: 512, maskable: false, raw: true },
  ];

  for (const t of targets) {
    const svg = svgIcon(t.size, t.maskable);
    const out = join(outDir, t.file);
    if (t.raw) {
      writeFileSync(out, svg, 'utf8');
      console.log(`wrote ${t.file}`);
      continue;
    }
    await sharp(Buffer.from(svg)).png().toFile(out);
    console.log(`wrote ${t.file} ${t.size}x${t.size}`);
  }
  // Also write source SVG at 512 for future white-label editing
  writeFileSync(join(outDir, 'icon-source-maskable.svg'), svgIcon(512, true), 'utf8');
  console.log('done');
}

gen().catch(e => { console.error(e); process.exit(1); });
