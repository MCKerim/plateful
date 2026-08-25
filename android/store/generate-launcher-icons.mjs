// Regenerates the Plateful Android launcher icon from the approved app-icon
// foreground (docs/brand/04-app-icon-and-brand-mark.md in the iOS repo).
// The composition mirrors the approved iOS icon; only the scale changes, so the
// bowl clears Android's 72dp adaptive-icon safe zone.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const MASTER = process.env.PLATEFUL_ICON_MASTER
  ?? "../ios-native/plateful/plateful/AppIcon.icon/Assets/mascot-food-salad-transparent-v0.2.png";
const BB = { x: 140, y: 263, w: 973, h: 738 };   // alpha bounds of the approved foreground
const OUT = process.argv[2] ?? "android/app/src/main/res";
const MONO = process.argv[3] ?? "silhouette";    // "silhouette" | "luminance"

// Apple system-light, sampled off the approved icon render.
const BG_TOP = "#FFFFFF", BG_BOTTOM = "#EFEFEF";

const DENSITIES = [["ldpi", 0.75], ["mdpi", 1], ["hdpi", 1.5], ["xhdpi", 2], ["xxhdpi", 3], ["xxxhdpi", 4]];

// Approved iOS icon, measured off its render: the bowl is 82.4% of the frame
// and sits centred 56.2% down. Android shows only the middle 72 of 108dp, so
// the same proportions inside that viewport are 54.9% wide, nudged 4.1% down.
const ADAPTIVE_BOWL_FRACTION = 0.549;
const ADAPTIVE_NUDGE = 0.0413;
// Legacy icons carry their own shape and are never re-masked, so they keep the
// iOS proportions directly.
const LEGACY_BOWL_FRACTION = 0.80;
const LEGACY_NUDGE = 0.03;

// Measured on the master: eyes at 37.5%/62.3% across,
// 62.1% down, 4.7% x 9.9% of the bowl box.
const EYES = [{ cx: 0.375, cy: 0.621 }, { cx: 0.623, cy: 0.621 }];
const EYE_W = 0.047, EYE_H = 0.099;

const trimmed = () => sharp(MASTER).extract({ left: BB.x, top: BB.y, width: BB.w, height: BB.h });

const gradient = (size) => Buffer.from(
  `<svg width="${size}" height="${size}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
  `<stop offset="0" stop-color="${BG_TOP}"/><stop offset="1" stop-color="${BG_BOTTOM}"/>` +
  `</linearGradient></defs><rect width="${size}" height="${size}" fill="url(#g)"/></svg>`);

async function bowlOnSquare(size, fraction, nudge, source = trimmed()) {
  const w = Math.round(size * fraction);
  const h = Math.round((w * BB.h) / BB.w);
  const bowl = await source.resize(w, h).png().toBuffer();
  const top = Math.round((size - h) / 2 + size * nudge);
  return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: bowl, left: Math.round((size - w) / 2), top }]);
}

/** Android tints the monochrome layer's alpha, so alpha means "ink here". */
async function monochromeSource(kind) {
  const { data, info } = await trimmed().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * channels, o = (y * width + x) * 4;
    const L = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    let opacity;
    if (kind === "luminance") {
      opacity = Math.min(1, 0.35 + 0.65 * Math.pow(1 - L, 1.5));
    } else {
      // Solid ceramic, lighter food so the rim still reads, eyes as negative
      // space. Ceramic is a near-neutral matte, so saturation separates the
      // food from the bowl along the rim's real curve.
      const mx = Math.max(data[i], data[i + 1], data[i + 2]);
      const mn = Math.min(data[i], data[i + 1], data[i + 2]);
      const sat = mx === 0 ? 0 : (mx - mn) / mx;
      const t = Math.min(1, Math.max(0, (sat - 0.18) / (0.35 - 0.18)));
      opacity = 1 - 0.38 * (t * t * (3 - 2 * t));
      for (const e of EYES) {
        const dx = (x / width - e.cx) / (EYE_W / 2), dy = (y / height - e.cy) / (EYE_H / 2);
        if (dx * dx + dy * dy <= 1) opacity = 0;
      }
    }
    out[o] = out[o + 1] = out[o + 2] = 0;
    out[o + 3] = Math.round(data[i + 3] * opacity);
  }
  return sharp(out, { raw: { width, height, channels: 4 } });
}

const shapeMask = (size, radius) => Buffer.from(
  `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`);

async function legacyIcon(size, radius) {
  const bowl = await (await bowlOnSquare(size, LEGACY_BOWL_FRACTION, LEGACY_NUDGE)).png().toBuffer();
  const composed = await sharp(gradient(size)).composite([{ input: bowl }]).png().toBuffer();
  return sharp(composed).composite([{ input: shapeMask(size, radius), blend: "dest-in" }]);
}

const write = async (img, file) => {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, await img.png({ compressionLevel: 9 }).toBuffer());
};

// Safety check: nothing may leave Android's 72dp safe circle.
{
  const N = 432, probe = await (await bowlOnSquare(N, ADAPTIVE_BOWL_FRACTION, ADAPTIVE_NUDGE)).raw().toBuffer({ resolveWithObject: true });
  let maxR = 0;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++)
    if (probe.data[(y * N + x) * 4 + 3] > 8) maxR = Math.max(maxR, Math.hypot(x + 0.5 - N / 2, y + 0.5 - N / 2));
  const dp = maxR / N * 108;
  console.log(`safe-zone check: furthest pixel ${dp.toFixed(1)}dp from centre (limit 36dp) — ${dp <= 36 ? "OK" : "TOO BIG"}`);
  if (dp > 36) process.exit(1);
}

const monoBuf = await (await monochromeSource(MONO)).png().toBuffer();

for (const [density, scale] of DENSITIES) {
  const adaptive = Math.round(108 * scale), legacy = Math.round(48 * scale);
  const dir = path.join(OUT, `mipmap-${density}`);
  await write(await bowlOnSquare(adaptive, ADAPTIVE_BOWL_FRACTION, ADAPTIVE_NUDGE), path.join(dir, "ic_launcher_foreground.png"));
  await write(await bowlOnSquare(adaptive, ADAPTIVE_BOWL_FRACTION, ADAPTIVE_NUDGE, sharp(monoBuf)), path.join(dir, "ic_launcher_monochrome.png"));
  await write(await legacyIcon(legacy, Math.round(legacy * 0.2)), path.join(dir, "ic_launcher.png"));
  await write(await legacyIcon(legacy, legacy / 2), path.join(dir, "ic_launcher_round.png"));
}
console.log(`wrote 4 files x ${DENSITIES.length} densities (monochrome: ${MONO})`);

await write(await legacyIcon(512, 0), path.join(OUT, "play-store-icon-512.png"));
console.log("play-store-icon-512.png");
