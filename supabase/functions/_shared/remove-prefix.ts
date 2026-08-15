/**
 * Recursive-ish deletion of every object directly under a storage prefix.
 *
 * Extracted from `recipe-storage-maintenance` so the loop's termination
 * behaviour can be unit tested — it previously could not tell "this folder is
 * enormous" from "deletion is not taking effect", and reported the former for
 * both. Two cleanup jobs died against prefixes holding zero objects with
 * "cleanup prefix exceeded the 10,000-object safety limit", which sent an
 * investigation looking for a folder that did not exist.
 */

/** The subset of the Storage client this helper needs. */
export interface PrefixStorage {
  list(
    prefix: string,
    options: {
      limit: number;
      offset: number;
      sortBy: { column: string; order: string };
    }
  ): Promise<{ data: { name: string; id: string | null }[] | null; error: unknown }>;
  remove(paths: string[]): Promise<{ data: { name: string }[] | null; error: unknown }>;
}

/** Pages are 100 objects, so this caps a single job at 10,000 objects. */
export const MAX_PAGES = 100;
export const PAGE_SIZE = 100;

export async function removePrefix(storage: PrefixStorage, prefix: string): Promise<number> {
  let removed = 0;

  // Removing each page changes the next page, so always request offset zero.
  // SEC-003 paths are exactly one folder deep; nested folders are rejected.
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { data: entries, error: listError } = await storage.list(prefix, {
      limit: PAGE_SIZE,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });
    if (listError) throw listError;

    const nestedFolder = (entries ?? []).find((entry) => entry.id == null);
    if (nestedFolder) {
      throw new Error("cleanup prefix contains an unexpected nested folder");
    }

    const paths = (entries ?? []).map((entry) => `${prefix}/${entry.name}`);
    if (paths.length === 0) return removed;

    const { data: deleted, error: removeError } = await storage.remove(paths);
    if (removeError) throw removeError;

    // Count what Storage says it deleted, not what we asked it to delete. A
    // silently skipped path stays in the listing, so crediting `paths.length`
    // here both over-reports and hides a loop that is making no progress.
    const deletedCount = deleted?.length ?? 0;
    if (deletedCount === 0) {
      throw new Error(
        `cleanup made no progress on "${prefix}": ` +
          `${paths.length} object(s) still listed after a delete that removed none`
      );
    }
    removed += deletedCount;
  }

  throw new Error(
    `cleanup of "${prefix}" did not finish within ${MAX_PAGES} pages ` +
      `(${MAX_PAGES * PAGE_SIZE} objects); ${removed} removed so far`
  );
}
