/**
 * A random v4 UUID, without depending on `crypto.randomUUID`.
 *
 * `crypto.randomUUID` is secure-context-only and absent from older WebViews,
 * and on 2026-09-17 it threw `crypto.randomUUID is not a function` on a real
 * device (Galaxy S24 Ultra, Android 12, WebView 131, `https://localhost`) —
 * an environment that should have it, so the trigger is the WebView's, not
 * ours, and no version check would have predicted it. That throw landed in a
 * `useState` initializer, which takes the whole dialog down with it; other
 * call sites mint ids for rows we are about to write, where a throw loses the
 * user's edit. Nothing here needs the API badly enough to crash over it.
 *
 * `crypto.getRandomValues` carries the fallback: it works in insecure
 * contexts and predates `randomUUID` by a decade. `Math.random` is the last
 * resort — not cryptographically strong, but these ids are row keys and
 * client-side draft handles, never secrets or tokens, and staying up beats
 * being strict.
 */
export function randomId(): string {
  const webCrypto = globalThis.crypto as Crypto | undefined;

  if (typeof webCrypto?.randomUUID === "function") return webCrypto.randomUUID();

  const bytes = new Uint8Array(16);
  if (typeof webCrypto?.getRandomValues === "function") {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // RFC 4122 §4.4: version nibble 4, variant bits 10xx.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
