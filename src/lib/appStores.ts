// Dependency-free: `api/share.ts` (edge function) imports this through `sharePreview.ts`.

export const APP_STORE_ID = "6788850965";
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.kblanks.plateful";

function isIOS(): boolean {
  const ua = navigator.userAgent;
  // iPadOS Safari sends a Mac user agent; only the touch points give it away.
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** Which stores sell the app on this device: one on a phone or tablet, both on a desktop. */
export function storesForDevice() {
  const ios = isIOS();
  return {
    appStore: ios || !/Android/.test(navigator.userAgent),
    playStore: !ios,
  };
}

/** The one store this phone or tablet installs from, or `null` on a desktop. */
export function mobileStoreUrl(): string | null {
  if (isIOS()) return APP_STORE_URL;
  if (/Android/.test(navigator.userAgent)) return PLAY_STORE_URL;
  return null;
}
