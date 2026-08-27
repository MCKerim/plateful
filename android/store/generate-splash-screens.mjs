// Regenerates the legacy Android splash screens from the approved app-icon
// foreground (docs/brand/04-app-icon-and-brand-mark.md in the iOS repo).
//
//   node android/store/generate-splash-screens.mjs        # from the repo root
//
// These only matter on Android 11 and below. From Android 12 the system draws
// the splash itself from the adaptive launcher icon and ignores the
// `android:background="@drawable/splash"` in AppTheme.NoActionBarLaunch, so on
// a modern device the new mascot already appears without these files. minSdk
// is 24, which is why they are still generated at all.
import sharp from "sharp";
import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const MASTER = process.env.PLATEFUL_ICON_MASTER
  ?? "../ios-native/plateful/plateful/AppIcon.icon/Assets/mascot-food-salad-transparent-v0.2.png";
const BB = { x: 140, y: 263, w: 973, h: 738 };   // alpha bounds of the approved foreground
const RES = "android/app/src/main/res";

// The app's own page background, so the handoff into the web view does not
// flash. The set this replaces used #FFFFFF / #111111, which did.
const LIGHT = { r: 0xfa, g: 0xf9, b: 0xf5, alpha: 1 };
const DARK = { r: 0x0a, g: 0x09, b: 0x05, alpha: 1 };

// Fraction of the SHORT side. The old set sized off width, so the mascot came
// out half again as large in landscape as in portrait; this keeps both equal.
const BOWL_OF_SHORT_SIDE = 0.26;

const trimmed = () => sharp(MASTER).extract({ left: BB.x, top: BB.y, width: BB.w, height: BB.h });

const dirs = readdirSync(RES).filter((d) => {
  try { return readdirSync(path.join(RES, d)).includes("splash.png"); } catch { return false; }
});

let count = 0;
for (const dir of dirs) {
  const file = path.join(RES, dir, "splash.png");
  const { width, height } = await sharp(file).metadata();
  const short = Math.min(width, height);
  const w = Math.round(short * BOWL_OF_SHORT_SIDE);
  const h = Math.round((w * BB.h) / BB.w);
  const bowl = await trimmed().resize(w, h).png().toBuffer();
  const background = dir.includes("night") ? DARK : LIGHT;
  writeFileSync(file, await sharp({ create: { width, height, channels: 4, background } })
    .composite([{ input: bowl, left: Math.round((width - w) / 2), top: Math.round((height - h) / 2) }])
    .png({ compressionLevel: 9 }).toBuffer());
  count++;
}
console.log(`regenerated ${count} splash screens (${BOWL_OF_SHORT_SIDE * 100}% of the short side, app-matched backgrounds)`);
