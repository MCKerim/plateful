import { describe, expect, it, vi } from "vitest";
import { MAX_PAGES, PAGE_SIZE, PrefixStorage, removePrefix } from "./remove-prefix";

function entries(count: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => ({
    name: `img-${offset + i}.jpg`,
    id: `id-${offset + i}`,
  }));
}

/** A storage double whose listing actually shrinks as objects are removed. */
function workingStorage(objectCount: number): PrefixStorage {
  let remaining = entries(objectCount);
  return {
    list: vi.fn(async () => ({ data: remaining.slice(0, PAGE_SIZE), error: null })),
    remove: vi.fn(async (paths: string[]) => {
      const names = new Set(paths.map((p) => p.split("/").pop()));
      const deleted = remaining.filter((e) => names.has(e.name));
      remaining = remaining.filter((e) => !names.has(e.name));
      return { data: deleted.map((e) => ({ name: e.name })), error: null };
    }),
  };
}

describe("removePrefix", () => {
  it("returns zero for an empty prefix without calling remove", async () => {
    const storage: PrefixStorage = {
      list: vi.fn(async () => ({ data: [], error: null })),
      remove: vi.fn(async () => ({ data: [], error: null })),
    };

    await expect(removePrefix(storage, "recipe_abc")).resolves.toBe(0);
    expect(storage.remove).not.toHaveBeenCalled();
  });

  it("removes every object across multiple pages", async () => {
    const storage = workingStorage(250);
    await expect(removePrefix(storage, "recipe_abc")).resolves.toBe(250);
  });

  it("counts what storage actually deleted, not what was requested", async () => {
    let remaining = entries(3);
    const storage: PrefixStorage = {
      list: vi.fn(async () => ({ data: remaining, error: null })),
      // Three paths are requested but Storage reports removing only two — the
      // third was already gone. The prefix still ends up empty, so the loop
      // finishes; the tally must be 2, not the 3 we asked for.
      remove: vi.fn(async () => {
        const deleted = remaining.slice(0, 2).map((e) => ({ name: e.name }));
        remaining = [];
        return { data: deleted, error: null };
      }),
    };

    await expect(removePrefix(storage, "recipe_abc")).resolves.toBe(2);
  });

  it("credits partial progress before failing on a stuck object", async () => {
    let remaining = entries(3);
    let call = 0;
    const storage: PrefixStorage = {
      list: vi.fn(async () => ({ data: remaining, error: null })),
      remove: vi.fn(async () => {
        call += 1;
        if (call === 1) {
          const deleted = remaining.slice(0, 2).map((e) => ({ name: e.name }));
          remaining = remaining.slice(2);
          return { data: deleted, error: null };
        }
        // The last object refuses to budge on every later pass.
        return { data: [], error: null };
      }),
    };

    await expect(removePrefix(storage, "recipe_partial")).rejects.toThrow(
      /made no progress on "recipe_partial": 1 object\(s\) still listed/
    );
    expect(storage.remove).toHaveBeenCalledTimes(2);
  });

  // The regression: remove() reports success but deletes nothing, so the
  // listing never shrinks. This used to spin for all 100 pages and then blame
  // a 10,000-object folder — for a prefix that could hold as little as one file.
  it("fails fast, and accurately, when a delete removes nothing", async () => {
    const storage: PrefixStorage = {
      list: vi.fn(async () => ({ data: entries(1), error: null })),
      remove: vi.fn(async () => ({ data: [], error: null })),
    };

    await expect(removePrefix(storage, "recipe_stuck")).rejects.toThrow(
      /made no progress on "recipe_stuck"/
    );
    // One pass, not MAX_PAGES worth of thrashing.
    expect(storage.remove).toHaveBeenCalledTimes(1);
  });

  it("does not claim an object-count limit when it hit the page limit", async () => {
    // Always full pages that do shrink, so it legitimately exhausts MAX_PAGES.
    const storage = workingStorage(PAGE_SIZE * MAX_PAGES + PAGE_SIZE);

    await expect(removePrefix(storage, "recipe_huge")).rejects.toThrow(
      /did not finish within 100 pages/
    );
  });

  it("rejects a nested folder", async () => {
    const storage: PrefixStorage = {
      list: vi.fn(async () => ({ data: [{ name: "sub", id: null }], error: null })),
      remove: vi.fn(async () => ({ data: [], error: null })),
    };

    await expect(removePrefix(storage, "recipe_abc")).rejects.toThrow(/nested folder/);
  });

  it("propagates a list error", async () => {
    const failure = new Error("list exploded");
    const storage: PrefixStorage = {
      list: vi.fn(async () => ({ data: null, error: failure })),
      remove: vi.fn(async () => ({ data: [], error: null })),
    };

    await expect(removePrefix(storage, "recipe_abc")).rejects.toBe(failure);
  });
});
