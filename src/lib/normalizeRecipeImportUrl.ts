export const MAX_RECIPE_IMPORT_URL_LENGTH = 2_048;

/**
 * Normalizes a user-entered recipe link at the client boundary. The database
 * and extraction worker enforce the same rules; this gives immediate feedback
 * instead of starting an import that they must reject.
 */
export function normalizeRecipeImportUrl(raw: string): string | null {
  let text = raw.trim();
  if (text === "") return null;

  const lower = text.toLowerCase();
  if (lower.startsWith("http://")) {
    text = "https://" + text.slice("http://".length);
  } else if (!lower.startsWith("https://")) {
    text = "https://" + text;
  }

  if (text.length > MAX_RECIPE_IMPORT_URL_LENGTH) return null;

  try {
    const url = new URL(text);
    if (
      url.protocol !== "https:" ||
      url.username !== "" ||
      url.password !== "" ||
      (url.port !== "" && url.port !== "443") ||
      !url.hostname.includes(".")
    ) {
      return null;
    }

    const normalized = url.toString();
    return normalized.length <= MAX_RECIPE_IMPORT_URL_LENGTH ? normalized : null;
  } catch {
    return null;
  }
}
