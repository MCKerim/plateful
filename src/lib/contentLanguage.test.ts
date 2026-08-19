import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  i18n: { language: "en", resolvedLanguage: undefined as string | undefined },
}));

vi.mock("@/i18n", () => ({ default: mocks.i18n }));

import { contentLanguage } from "./contentLanguage";

describe("contentLanguage", () => {
  beforeEach(() => {
    mocks.i18n.language = "en";
    mocks.i18n.resolvedLanguage = "en";
  });

  it("uses the language i18next resolved, not the one it detected", () => {
    // A French browser: the UI falls back to English because `supportedLngs`
    // has no "fr", so recipes must be generated in English too.
    mocks.i18n.language = "fr";
    mocks.i18n.resolvedLanguage = "en";

    expect(contentLanguage()).toBe("en");
  });

  it("strips the region", () => {
    mocks.i18n.language = "de-AT";
    mocks.i18n.resolvedLanguage = "de-AT";

    expect(contentLanguage()).toBe("de");
  });

  it("falls back to the detected language when nothing has resolved yet", () => {
    mocks.i18n.language = "de";
    mocks.i18n.resolvedLanguage = undefined;

    expect(contentLanguage()).toBe("de");
  });
});
