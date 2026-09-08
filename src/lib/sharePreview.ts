/**
 * Link previews for share links (`https://app.plateful.cloud/share/<token>`).
 *
 * Messaging apps (WhatsApp, iMessage, Telegram, Slack) fetch a pasted link
 * themselves, without running JavaScript, and read Open Graph tags out of the
 * HTML head. The single-page shell has none, so a bare "Plateful" card was all
 * a recipient saw. The Vercel function in `api/share.ts` resolves the share
 * token and serves the same shell with the recipe's name, description and
 * cover injected — for everyone, bots and people alike, so the page itself
 * keeps working exactly as before.
 *
 * Everything here is pure and dependency-free: the function bundle stays
 * small, and the HTML shaping is unit-tested without a network.
 */

/** What the preview needs from a `shared_recipes.snapshot`. */
export type SharePreviewSnapshot = {
  name: string;
  description?: string | null;
  image_urls?: string[] | null;
};

/** The resolver only answers exact 128-bit hex tokens; anything else is a miss. */
export const SHARE_TOKEN_RE = /^[0-9a-f]{32}$/;

const BUCKET = "recipeimages";
const MAX_DESCRIPTION_LENGTH = 200;
const FALLBACK_DESCRIPTION = "Shared with you on Plateful";

/** Escapes text for an HTML attribute or text node. Recipe data is user data. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * The first snapshot image that is one of ours: https, on the project's own
 * origin, inside the recipe bucket (public copies now, signed URLs in legacy
 * rows). Mirrors `isTrustedRecipeImageUrl` in the app, without its imports.
 * Only a URL that passes is ever written into the page.
 */
export function trustedShareImage(
  urls: readonly string[] | null | undefined,
  projectUrl: string
): string | null {
  let project: URL;
  try {
    project = new URL(projectUrl);
  } catch {
    return null;
  }
  const prefixes = [`/storage/v1/object/public/${BUCKET}/`, `/storage/v1/object/sign/${BUCKET}/`];
  for (const raw of urls ?? []) {
    try {
      const url = new URL(raw);
      const trusted =
        url.protocol === "https:" &&
        url.origin === project.origin &&
        url.username === "" &&
        url.password === "" &&
        prefixes.some(
          (prefix) => url.pathname.startsWith(prefix) && url.pathname.length > prefix.length
        );
      if (trusted) return url.toString();
    } catch {
      // Not a URL at all — try the next one.
    }
  }
  return null;
}

/** One line of description for the card: collapsed whitespace, capped, or the fallback. */
export function previewDescription(description: string | null | undefined): string {
  const collapsed = (description ?? "").replace(/\s+/g, " ").trim();
  if (collapsed.length === 0) return FALLBACK_DESCRIPTION;
  if (collapsed.length <= MAX_DESCRIPTION_LENGTH) return collapsed;
  return `${collapsed.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}…`;
}

function imageMimeType(url: string): string | null {
  const extension = new URL(url).pathname.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return null;
  }
}

export type PreviewInput = {
  snapshot: SharePreviewSnapshot;
  /** The canonical share URL, `https://app.plateful.cloud/share/<token>`. */
  pageUrl: string;
  /** The Supabase project URL, which decides which image URLs are ours. */
  projectUrl: string;
};

/** The Open Graph and Twitter Card tags for one shared recipe. */
export function previewTags({ snapshot, pageUrl, projectUrl }: PreviewInput): string {
  const title = escapeHtml(snapshot.name.trim());
  const description = escapeHtml(previewDescription(snapshot.description));
  const image = trustedShareImage(snapshot.image_urls, projectUrl);
  const lines = [
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="Plateful" />`,
    `<meta property="og:url" content="${escapeHtml(pageUrl)}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta name="description" content="${description}" />`,
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
  ];
  if (image) {
    const escapedImage = escapeHtml(image);
    lines.push(`<meta property="og:image" content="${escapedImage}" />`);
    const type = imageMimeType(image);
    if (type) lines.push(`<meta property="og:image:type" content="${type}" />`);
    lines.push(`<meta name="twitter:image" content="${escapedImage}" />`);
  }
  return lines.join("\n    ");
}

/**
 * The shell with the recipe's title in place of the generic one and the tags
 * inserted at the end of the head. Returns the shell unchanged when it has no
 * head to inject into, so a surprising shell still serves the app.
 */
export function injectPreview(shell: string, input: PreviewInput): string {
  const headEnd = shell.indexOf("</head>");
  if (headEnd === -1) return shell;
  const title = `<title>${escapeHtml(input.snapshot.name.trim())} · Plateful</title>`;
  const withTitle = shell.replace(/<title>[^<]*<\/title>/, title);
  const insertAt = withTitle.indexOf("</head>");
  return `${withTitle.slice(0, insertAt)}    ${previewTags(input)}\n  ${withTitle.slice(insertAt)}`;
}
