import { describe, expect, it } from "vitest";
import {
  clearPendingSignIn,
  isMagicLinkLanding,
  magicLinkAccessToken,
  markIfMagicLinkSession,
  markPendingSignIn,
  rememberMagicLinkLanding,
  spendPendingSignIn,
} from "./pendingSignIn";

const landing =
  "https://app.plateful.cloud/#access_token=tok-1&expires_in=3600&refresh_token=ref&token_type=bearer&type=magiclink";

describe("pendingSignIn", () => {
  it("hands the marked method over exactly once", () => {
    markPendingSignIn("google");
    expect(spendPendingSignIn()).toBe("google");
    // An ordinary reload identifies without anyone having signed in.
    expect(spendPendingSignIn()).toBeNull();
  });

  it("forgets a sign-in that did not happen", () => {
    markPendingSignIn("google");
    clearPendingSignIn();
    expect(spendPendingSignIn()).toBeNull();
  });

  it("reads the access token of an email-link landing", () => {
    expect(magicLinkAccessToken(landing)).toBe("tok-1");
    // A brand-new address gets the signup template from the same signInWithOtp.
    expect(isMagicLinkLanding("https://app.plateful.cloud/#access_token=abc&type=signup")).toBe(true);
  });

  it("ignores every other page and every other email link", () => {
    expect(isMagicLinkLanding("https://app.plateful.cloud/")).toBe(false);
    expect(isMagicLinkLanding("https://app.plateful.cloud/home#section")).toBe(false);
    expect(isMagicLinkLanding("https://app.plateful.cloud/#access_token=abc&type=recovery")).toBe(false);
    expect(isMagicLinkLanding("https://app.plateful.cloud/#type=magiclink")).toBe(false);
    expect(isMagicLinkLanding("https://app.plateful.cloud/?type=magiclink")).toBe(false);
  });

  it("marks magic_link only for the session the landing established", () => {
    rememberMagicLinkLanding(landing);
    // A stored session for someone else (the link failed or was stale).
    markIfMagicLinkSession({ access_token: "other" });
    expect(spendPendingSignIn()).toBeNull();
    // The session built from the fragment.
    markIfMagicLinkSession({ access_token: "tok-1" });
    expect(spendPendingSignIn()).toBe("magic_link");
    // Spent: a later refresh with the same token is not another sign-in.
    markIfMagicLinkSession({ access_token: "tok-1" });
    expect(spendPendingSignIn()).toBeNull();
  });

  it("marks nothing without a landing", () => {
    rememberMagicLinkLanding("https://app.plateful.cloud/home");
    markIfMagicLinkSession({ access_token: "tok-1" });
    markIfMagicLinkSession(null);
    expect(spendPendingSignIn()).toBeNull();
  });
});
