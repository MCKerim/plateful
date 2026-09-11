import { describe, expect, it } from "vitest";
import {
  clearPendingSignIn,
  isMagicLinkLanding,
  markPendingSignIn,
  spendPendingSignIn,
} from "./pendingSignIn";

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

  it("recognises where a magic link lands", () => {
    expect(
      isMagicLinkLanding(
        "https://app.plateful.cloud/#access_token=abc&expires_in=3600&refresh_token=def&token_type=bearer&type=magiclink"
      )
    ).toBe(true);
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
});
