import { SHARE_TOKEN_RE, injectPreview, type SharePreviewSnapshot } from "../src/lib/sharePreview";

/**
 * `GET /share/<token>` — the share link's web page, with link-preview tags.
 *
 * `vercel.json` rewrites the share path here. The function serves the app's
 * own single-page shell (`/index.html`, fetched from this deployment) after
 * injecting the shared recipe's Open Graph tags, so messaging apps render a
 * card with the recipe's name, description and cover while browsers get the
 * unchanged app. The token is resolved through the same public RPC the page
 * uses; a miss or any failure serves the plain shell, which then shows the
 * page's own "gone" state. See `src/lib/sharePreview.ts`.
 *
 * Runs at the edge; snapshots never change, so a preview is cached for a
 * day per token and the resolver sees one call per share, not one per fetch.
 */
export const config = { runtime: "edge" };

const PREVIEW_CACHE = "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";
const MISS_CACHE = "public, max-age=0, s-maxage=60";
const RESOLVE_TIMEOUT_MS = 5000;

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";

  const shell = await fetchShell(url.origin);
  if (shell === null) {
    return new Response("Plateful is unavailable right now.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (!SHARE_TOKEN_RE.test(token)) return html(shell, MISS_CACHE);

  const snapshot = await resolveSnapshot(token);
  if (snapshot === null) return html(shell, MISS_CACHE);

  const projectUrl = env("VITE_SUPABASE_URL") ?? "";
  const pageUrl = `${url.origin}/share/${token}`;
  return html(injectPreview(shell, { snapshot, pageUrl, projectUrl }), PREVIEW_CACHE);
}

/** The deployment's own app shell, or `null` when it can't be fetched. */
async function fetchShell(origin: string): Promise<string | null> {
  try {
    const response = await fetch(new URL("/index.html", origin), {
      signal: AbortSignal.timeout(RESOLVE_TIMEOUT_MS),
    });
    return response.ok ? await response.text() : null;
  } catch {
    return null;
  }
}

/**
 * The share's snapshot through `resolve_recipe_share`, the exact-token RPC
 * that works without a session. `null` for a miss, a malformed answer, or
 * any failure — the page degrades to its own handling either way.
 */
async function resolveSnapshot(token: string): Promise<SharePreviewSnapshot | null> {
  const projectUrl = env("VITE_SUPABASE_URL");
  const anonKey = env("VITE_SUPABASE_ANON_KEY");
  if (!projectUrl || !anonKey) return null;

  try {
    const response = await fetch(`${projectUrl}/rest/v1/rpc/resolve_recipe_share`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_token: token }),
      signal: AbortSignal.timeout(RESOLVE_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const rows: unknown = await response.json();
    const snapshot = Array.isArray(rows) ? (rows[0] as { snapshot?: unknown })?.snapshot : null;
    if (!snapshot || typeof snapshot !== "object") return null;
    const { name, description, image_urls } = snapshot as Record<string, unknown>;
    if (typeof name !== "string" || name.trim().length === 0) return null;
    return {
      name,
      description: typeof description === "string" ? description : null,
      image_urls: Array.isArray(image_urls)
        ? image_urls.filter((entry): entry is string => typeof entry === "string")
        : [],
    };
  } catch {
    return null;
  }
}

/**
 * A deployment environment variable (the same `VITE_*` values the client
 * build uses; the anon key is public). Read off `globalThis` so this file
 * type-checks in the app's program too, which has no Node types.
 */
function env(name: string): string | undefined {
  const process = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process;
  return process?.env?.[name];
}

function html(body: string, cacheControl: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": cacheControl,
    },
  });
}
