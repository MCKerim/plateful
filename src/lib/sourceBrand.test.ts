import { describe, expect, it } from "vitest";
import tiktok from "@/assets/source-brands/tiktok.svg";
import youtube from "@/assets/source-brands/youtube.svg";
import instagram from "@/assets/source-brands/instagram.svg";
import { sourceBrandGlyph } from "./sourceBrand";

describe("sourceBrandGlyph", () => {
  it("matches a brand's domains and subdomains", () => {
    expect(sourceBrandGlyph("https://vm.tiktok.com/abc")).toBe(tiktok);
    expect(sourceBrandGlyph("https://youtu.be/abc")).toBe(youtube);
    expect(sourceBrandGlyph("https://www.instagram.com/p/abc/")).toBe(instagram);
  });

  it("does not match lookalike hosts", () => {
    expect(sourceBrandGlyph("https://spin.it/x")).toBeNull();
    expect(sourceBrandGlyph("https://threadsmagazine.com/x")).toBeNull();
    expect(sourceBrandGlyph("https://smittenkitchen.com/pasta")).toBeNull();
  });

  it("returns null for a link that is not a URL", () => {
    expect(sourceBrandGlyph("not a link")).toBeNull();
  });
});
