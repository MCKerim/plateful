import { describe, expect, it } from "vitest";
import {
  SHARE_TOKEN_RE,
  escapeHtml,
  injectPreview,
  previewDescription,
  previewTags,
  trustedShareImage,
} from "./sharePreview";

const projectUrl = "https://upupcsgufoejppoietiu.supabase.co";
const cover = `${projectUrl}/storage/v1/object/public/recipeimages/shared_00000000-0000-0000-0000-000000000001/a.jpg`;
const pageUrl = "https://app.plateful.cloud/share/0123456789abcdef0123456789abcdef";

const shell = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Plateful</title>
  </head>
  <body><div id="root"></div></body>
</html>`;

describe("share tokens", () => {
  it("accepts exactly the resolver's 32-hex shape", () => {
    expect(SHARE_TOKEN_RE.test("0123456789abcdef0123456789abcdef")).toBe(true);
    expect(SHARE_TOKEN_RE.test("0123456789ABCDEF0123456789abcdef")).toBe(false);
    expect(SHARE_TOKEN_RE.test("0123456789abcdef0123456789abcde")).toBe(false);
    expect(SHARE_TOKEN_RE.test("")).toBe(false);
  });
});

describe("trustedShareImage", () => {
  it("takes the first image on our project and bucket", () => {
    expect(trustedShareImage(["https://example.com/a.jpg", cover], projectUrl)).toBe(cover);
  });

  it("accepts a legacy signed URL from the bucket", () => {
    const signed = `${projectUrl}/storage/v1/object/sign/recipeimages/shared_x/a.jpg?token=abc`;
    expect(trustedShareImage([signed], projectUrl)).toBe(signed);
  });

  it("refuses foreign hosts, other buckets, plain http, and garbage", () => {
    expect(
      trustedShareImage(
        ["https://evil.example/storage/v1/object/public/recipeimages/a.jpg"],
        projectUrl
      )
    ).toBeNull();
    expect(
      trustedShareImage([`${projectUrl}/storage/v1/object/public/avatars/a.jpg`], projectUrl)
    ).toBeNull();
    expect(trustedShareImage([cover.replace("https:", "http:")], projectUrl)).toBeNull();
    expect(
      trustedShareImage([`${projectUrl}/storage/v1/object/public/recipeimages/`], projectUrl)
    ).toBeNull();
    expect(trustedShareImage(["not a url"], projectUrl)).toBeNull();
    expect(trustedShareImage(null, projectUrl)).toBeNull();
    expect(trustedShareImage([cover], "not a url")).toBeNull();
  });
});

describe("previewDescription", () => {
  it("collapses whitespace and caps the length", () => {
    expect(previewDescription("  Weeknight\n\npasta   sauce ")).toBe("Weeknight pasta sauce");
    const long = "a".repeat(400);
    const capped = previewDescription(long);
    expect(capped.length).toBe(200);
    expect(capped.endsWith("…")).toBe(true);
  });

  it("falls back when the recipe has no description", () => {
    expect(previewDescription(null)).toBe("Shared with you on Plateful");
    expect(previewDescription("   ")).toBe("Shared with you on Plateful");
  });
});

describe("previewTags", () => {
  it("escapes recipe data before it lands in the head", () => {
    const tags = previewTags({
      snapshot: { name: `Tom's "Best" <Pasta> & Co`, description: null, image_urls: [] },
      pageUrl,
      projectUrl,
    });
    expect(tags).toContain(`content="Tom&#39;s &quot;Best&quot; &lt;Pasta&gt; &amp; Co"`);
    expect(tags).not.toContain("<Pasta>");
    expect(escapeHtml(`<a href="x">`)).toBe("&lt;a href=&quot;x&quot;&gt;");
  });

  it("writes a large-image card when a trusted cover exists, a plain one otherwise", () => {
    const withImage = previewTags({
      snapshot: { name: "Pasta", description: "Silky.", image_urls: [cover] },
      pageUrl,
      projectUrl,
    });
    expect(withImage).toContain(`<meta property="og:image" content="${cover}" />`);
    expect(withImage).toContain(`<meta property="og:image:type" content="image/jpeg" />`);
    expect(withImage).toContain(`<meta name="twitter:card" content="summary_large_image" />`);
    expect(withImage).toContain(`<meta property="og:url" content="${pageUrl}" />`);
    expect(withImage).toContain(`<meta property="og:description" content="Silky." />`);

    const without = previewTags({
      snapshot: {
        name: "Pasta",
        description: "Silky.",
        image_urls: ["https://evil.example/a.jpg"],
      },
      pageUrl,
      projectUrl,
    });
    expect(without).not.toContain("og:image");
    expect(without).toContain(`<meta name="twitter:card" content="summary" />`);
  });
});

describe("injectPreview", () => {
  it("swaps the title and adds the tags at the end of the head", () => {
    const html = injectPreview(shell, {
      snapshot: {
        name: "Creamy Tomato Pasta",
        description: "Weeknight pasta.",
        image_urls: [cover],
      },
      pageUrl,
      projectUrl,
    });
    expect(html).toContain("<title>Creamy Tomato Pasta · Plateful</title>");
    expect(html).not.toContain("<title>Plateful</title>");
    expect(html.indexOf('property="og:title"')).toBeGreaterThan(html.indexOf("<title>"));
    expect(html.indexOf('property="og:title"')).toBeLessThan(html.indexOf("</head>"));
    expect(html).toContain('<div id="root"></div>');
  });

  it("leaves a shell without a head alone", () => {
    expect(injectPreview("<p>no head</p>", { snapshot: { name: "X" }, pageUrl, projectUrl })).toBe(
      "<p>no head</p>"
    );
  });
});
