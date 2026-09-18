import { describe, expect, it, afterEach, vi } from "vitest";
import { randomId } from "./randomId";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const original = globalThis.crypto;

/** Swaps in a partial `crypto`, the way a WebView missing `randomUUID` behaves. */
function withCrypto(replacement: unknown) {
  Object.defineProperty(globalThis, "crypto", {
    value: replacement,
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  withCrypto(original);
  vi.restoreAllMocks();
});

describe("randomId", () => {
  it("usesCryptoRandomUUIDWhenAvailable", () => {
    const randomUUID = vi.fn(() => "11111111-2222-4333-8444-555555555555");
    withCrypto({ randomUUID });
    expect(randomId()).toBe("11111111-2222-4333-8444-555555555555");
    expect(randomUUID).toHaveBeenCalledOnce();
  });

  it("fallsBackToGetRandomValuesWhenRandomUUIDIsMissing", () => {
    // The 2026-09-17 WebView: a `crypto` object, but no `randomUUID`.
    const getRandomValues = vi.fn((bytes: Uint8Array) => {
      bytes.fill(0xff);
      return bytes;
    });
    withCrypto({ getRandomValues });
    const id = randomId();
    expect(getRandomValues).toHaveBeenCalledOnce();
    expect(id).toMatch(UUID_V4);
  });

  it("survivesWithNoCryptoAtAll", () => {
    withCrypto(undefined);
    expect(randomId()).toMatch(UUID_V4);
  });

  it("setsTheVersionAndVariantBitsOnTheFallbackPath", () => {
    // All-zero bytes would produce an invalid UUID unless bits 6 and 8 are set.
    withCrypto({ getRandomValues: (bytes: Uint8Array) => bytes.fill(0x00) });
    expect(randomId()).toBe("00000000-0000-4000-8000-000000000000");
  });

  it("producesDistinctIdsOnTheFallbackPath", () => {
    withCrypto({ getRandomValues: original.getRandomValues.bind(original) });
    const ids = new Set(Array.from({ length: 500 }, randomId));
    expect(ids.size).toBe(500);
  });

  it("producesAValidUuidWithTheRealPlatformCrypto", () => {
    expect(randomId()).toMatch(UUID_V4);
  });
});
