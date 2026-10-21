import tiktok from "@/assets/source-brands/tiktok.svg";
import instagram from "@/assets/source-brands/instagram.svg";
import youtube from "@/assets/source-brands/youtube.svg";
import pinterest from "@/assets/source-brands/pinterest.svg";
import facebook from "@/assets/source-brands/facebook.svg";
import reddit from "@/assets/source-brands/reddit.svg";
import threads from "@/assets/source-brands/threads.svg";
import x from "@/assets/source-brands/x.svg";

/**
 * The common recipe sources with a bundled monochrome glyph, mirroring the
 * native app's `SourceBrand`. A host matches a domain or any subdomain of it,
 * anchored at a dot, so `spin.it` or `threadsmagazine.com` don't collide with
 * `pin.it` / `threads.net`.
 */
const BRANDS = [
  { glyph: tiktok, domains: ["tiktok.com"] },
  { glyph: instagram, domains: ["instagram.com"] },
  { glyph: youtube, domains: ["youtube.com", "youtu.be"] },
  { glyph: pinterest, domains: ["pinterest.com", "pin.it"] },
  { glyph: facebook, domains: ["facebook.com", "fb.com", "fb.watch"] },
  { glyph: reddit, domains: ["reddit.com", "redd.it"] },
  { glyph: threads, domains: ["threads.net", "threads.com"] },
  { glyph: x, domains: ["x.com", "twitter.com", "t.co"] },
];

/** The glyph URL for a recipe link's source, or `null` for any other site (or an unparsable link). */
export function sourceBrandGlyph(link: string): string | null {
  let host: string;
  try {
    host = new URL(link).hostname.toLowerCase();
  } catch {
    return null;
  }
  const brand = BRANDS.find((b) => b.domains.some((d) => host === d || host.endsWith(`.${d}`)));
  return brand?.glyph ?? null;
}
