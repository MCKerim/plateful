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

/**
 * Where the share or invite page's button sends a phone: the app at this link
 * when it is installed, else its store. `null` on a desktop. A link to the
 * page's own domain never opens the app, so iOS goes through plateful.cloud (a
 * second Universal Link domain, which redirects to the App Store without the
 * app); Android's intent URL opens the app or falls back to Google Play by
 * itself.
 */
export function openInAppLink(kind: "share" | "invite", token: string): string | null {
  const path = `${kind}/${encodeURIComponent(token)}`;
  if (isIOS()) return `https://plateful.cloud/${path}`;
  if (/Android/.test(navigator.userAgent)) {
    return `intent://app.plateful.cloud/${path}#Intent;scheme=https;package=com.kblanks.plateful;S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;
  }
  return null;
}
