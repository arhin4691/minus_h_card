/**
 * generate-splash.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates Apple PWA splash-screen images for every required device size.
 * Each image is a solid dark background (#0f172a) with the app icon centred.
 *
 * Prerequisites:
 *   npm install --save-dev sharp
 *
 * Usage:
 *   node scripts/generate-splash.mjs
 *
 * Output:  public/splash/apple-splash-<W>-<H>.png
 * ─────────────────────────────────────────────────────────────────────────────
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ICON_PATH = path.join(ROOT, 'public', 'title', 'title.png');
const OUT_DIR = path.join(ROOT, 'public', 'splash');

const BG_COLOR = { r: 15, g: 23, b: 42 };   // #0f172a — same as manifest background_color
const ICON_SIZE = 200;                         // px — icon rendered at this size on all splash images

/** All required Apple splash sizes [width, height] */
const SIZES = [
  [1320, 2868],  // iPhone 16 Pro Max
  [1206, 2622],  // iPhone 16 Pro
  [1290, 2796],  // iPhone 15 Pro Max / 14 Pro Max
  [1179, 2556],  // iPhone 15 Pro / 14 Pro
  [1284, 2778],  // iPhone 15 / 14 Plus / 13 Pro Max
  [1170, 2532],  // iPhone 14 / 13 Pro / 13 / 12
  [828,  1792],  // iPhone 11 / XR
  [1125, 2436],  // iPhone X / XS / 11 Pro
  [750,  1334],  // iPhone 8 / SE 2nd & 3rd gen
  [2048, 2732],  // iPad Pro 12.9"
  [1668, 2388],  // iPad Pro 11" / Air 4 & 5
  [1488, 2266],  // iPad mini 6
];

fs.mkdirSync(OUT_DIR, { recursive: true });

const iconBuffer = await sharp(ICON_PATH)
  .resize(ICON_SIZE, ICON_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

for (const [w, h] of SIZES) {
  const outFile = path.join(OUT_DIR, `apple-splash-${w}-${h}.png`);
  const left = Math.round((w - ICON_SIZE) / 2);
  const top  = Math.round((h - ICON_SIZE) / 2);

  await sharp({
    create: {
      width: w,
      height: h,
      channels: 3,
      background: BG_COLOR,
    },
  })
    .composite([{ input: iconBuffer, left, top }])
    .png({ compressionLevel: 9 })
    .toFile(outFile);

  console.log(`✓  ${w}×${h}  →  ${path.relative(ROOT, outFile)}`);
}

console.log('\nDone! All splash images written to public/splash/');
