import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPendingConsent,
  peekPendingConsent,
  rememberPendingConsent,
} from "./pendingOAuthConsent";

describe("pendingOAuthConsent", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("returns the consent path with its query string intact", () => {
    rememberPendingConsent("?authorization_id=abc123");

    // Losing the query string is the whole failure this guards against — the
    // authorization_id is the request.
    expect(peekPendingConsent()).toBe("/oauth/consent?authorization_id=abc123");
  });

  it("returns null when nothing is pending", () => {
    expect(peekPendingConsent()).toBeNull();
  });

  it("does not consume on peek, so a re-render can't lose it", () => {
    rememberPendingConsent("?authorization_id=abc123");

    expect(peekPendingConsent()).not.toBeNull();
    expect(peekPendingConsent()).not.toBeNull();
  });

  it("forgets it once cleared", () => {
    rememberPendingConsent("?authorization_id=abc123");
    clearPendingConsent();

    expect(peekPendingConsent()).toBeNull();
  });

  it("ignores a request older than the window", () => {
    // Supabase expires an authorization after 10 minutes; a day-old entry would
    // otherwise hijack an unrelated sign-in and dump the user on a dead page.
    vi.useFakeTimers();
    rememberPendingConsent("?authorization_id=stale");
    vi.advanceTimersByTime(16 * 60 * 1000);

    expect(peekPendingConsent()).toBeNull();
  });

  it("keeps a request that is expired but still within the window", () => {
    // Just past Supabase's 10 minutes: better to land back on the consent page
    // and be told it expired than to be silently sent to the home screen.
    vi.useFakeTimers();
    rememberPendingConsent("?authorization_id=justexpired");
    vi.advanceTimersByTime(12 * 60 * 1000);

    expect(peekPendingConsent()).toBe("/oauth/consent?authorization_id=justexpired");
  });

  it("survives malformed storage rather than throwing", () => {
    localStorage.setItem("plateful.pendingOAuthConsent", "not json");

    expect(peekPendingConsent()).toBeNull();
  });

  it("never breaks sign-in when storage is unavailable", () => {
    // Private mode / blocked cookies. Failing to remember is acceptable;
    // throwing inside the sign-in screen is not.
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(() => rememberPendingConsent("?authorization_id=abc")).not.toThrow();
    setItem.mockRestore();
  });
});
