// Regenerates the web icon set from the approved app-icon foreground
// (docs/brand/04-app-icon-and-brand-mark.md in the iOS repo). Do not redraw or
// recolour the mascot here.
//
//   npm run generate-icons
//
// Split of responsibilities, per Kerim's 2026-08-16 call on the website:
//   - tab icons (favicon.ico, favicon-16/32) use the TRANSPARENT mascot, so it
//     sits on whatever the browser paints behind it
//   - apple-touch-icon and the 1024 master use the full render WITH the System
//     Light background, because iOS backfills a transparent one with black
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const MASTER = process.env.PLATEFUL_ICON_MASTER
  ?? "../ios-native/plateful/plateful/AppIcon.icon/Assets/mascot-food-salad-transparent-v0.2.png";
const BB = { x: 140, y: 263, w: 973, h: 738 };   // alpha bounds of the approved foreground
const BOWL = 0.80, NUDGE = 0.03;                 // same composition as the Android launcher icon

const trimmed = () => sharp(MASTER).extract({ left: BB.x, top: BB.y, width: BB.w, height: BB.h });

const gradient = (s) => Buffer.from(
  `<svg width="${s}" height="${s}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
  `<stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EFEFEF"/></linearGradient></defs>` +
  `<rect width="${s}" height="${s}" fill="url(#g)"/></svg>`);

async function render(size, fraction, nudge, withBackground) {
  const w = Math.round(size * fraction);
  const h = Math.round((w * BB.h) / BB.w);
  const bowl = await trimmed().resize(w, h).png().toBuffer();
  const base = withBackground
    ? sharp(gradient(size))
    : sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
  return base
    .composite([{ input: bowl, left: Math.round((size - w) / 2), top: Math.round((size - h) / 2 + size * nudge) }])
    .png({ compressionLevel: 9 }).toBuffer();
}

/** A PNG-payload .ico, the way browsers have accepted them since IE11. */
function writeIco(file, entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + dir.length;
  entries.forEach(({ size, data }, i) => {
    const e = i * 16;
    dir[e] = dir[e + 1] = size >= 256 ? 0 : size;
    dir.writeUInt16LE(1, e + 4);
    dir.writeUInt16LE(32, e + 6);
    dir.writeUInt32LE(data.length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  writeFileSync(file, Buffer.concat([header, dir, ...entries.map((x) => x.data)]));
}

// 1024 master: source of truth for @capacitor/assets and the Android icon script.
const full = await render(1024, BOWL, NUDGE, true);
writeFileSync("public/logo.png", full);
writeFileSync("assets/icon.png", full);

writeFileSync("public/apple-touch-icon-180x180.png", await render(180, BOWL, NUDGE, true));

const tab = [];
for (const size of [16, 32, 48]) {
  const data = await render(size, 0.94, 0.03, false);
  tab.push({ size, data });
  if (size !== 48) writeFileSync(`public/favicon-${size}x${size}.png`, data);
}
writeIco("public/favicon.ico", tab);

console.log("public/logo.png, assets/icon.png (1024) + apple-touch-icon-180x180.png — System Light background");
console.log("public/favicon.ico (16/32/48), favicon-16x16.png, favicon-32x32.png — transparent");
