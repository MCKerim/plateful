# Android launcher icon

Regenerated from the approved app-icon foreground in the iOS repo
(`plateful/AppIcon.icon/Assets/mascot-food-salad-transparent-v0.2.png`), which
`docs/brand/04-app-icon-and-brand-mark.md` there names as the production master.
Do not redraw or recolour the mascot here.

Run it from the repo root, so `sharp` resolves out of `node_modules`:

```sh
node android/store/generate-launcher-icons.mjs         # writes android/app/src/main/res
PLATEFUL_ICON_MASTER=/path/to/master.png node android/store/generate-launcher-icons.mjs
```

## What differs from the iOS icon, and why

Content, background and composition match the approved icon. Only the scale
changes: Android shows just the middle 72 of an adaptive icon's 108dp layers, so
the bowl is sized to keep the same 82% presence *inside that viewport* while its
furthest pixel stays 30dp from centre, clear of the 36dp safe radius. The script
asserts this on every run.

- `ic_launcher_foreground` — mascot, transparent, 108dp layer
- `ic_launcher_monochrome` — Android 13+ themed icons: solid ceramic, food at
  62% (saturation separates it along the rim's real curve), eyes knocked out
- `drawable/ic_launcher_background.xml` — the icon's System Light field as a
  gradient, full-bleed. Never inset a background layer; the mask needs the corners.
- `ic_launcher` / `ic_launcher_round` — pre-composed, for API 24-25 only

`play-store-icon-512.png` is uploaded to the Play Console by hand; it does not
ship in the APK.

## Do not run `npx capacitor-assets generate`

`@capacitor/assets` is a devDependency and `assets/icon.png` is its source, so
that command regenerates `mipmap-*` with its own geometry — silently undoing the
safe-zone scale above and dropping the `ic_launcher_monochrome` layer entirely.
Use `generate-launcher-icons.mjs` instead. `assets/icon.png` is kept current
(same 1024 render as `public/logo.png`) so the mascot is at least right if
someone runs it anyway.
