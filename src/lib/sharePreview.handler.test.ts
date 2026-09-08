// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler from "../../api/share";

const shell = `<!doctype html><html><head><title>Plateful</title></head><body><div id="root"></div></body></html>`;
const projectUrl = "https://upupcsgufoejppoietiu.supabase.co";
const token = "0123456789abcdef0123456789abcdef";
const cover = `${projectUrl}/storage/v1/object/public/recipeimages/shared_x/a.jpg`;

/** Answers the shell fetch and the resolver call; records what was asked. */
function fakeNetwork(resolverBody: unknown, resolverStatus = 200) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request) => {
      const url = input instanceof Request ? input.url : input.toString();
      calls.push(url);
      if (url.endsWith("/index.html")) return new Response(shell, { status: 200 });
      return new Response(JSON.stringify(resolverBody), {
        status: resolverStatus,
        headers: { "Content-Type": "application/json" },
      });
    })
  );
  return calls;
}

describe("GET /share/<token>", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_SUPABASE_URL", projectUrl);
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("serves the shell with the recipe's tags and a long cache", async () => {
    const calls = fakeNetwork([
      {
        snapshot: {
          name: "Creamy Tomato Pasta",
          description: "Weeknight pasta.",
          image_urls: [cover],
        },
      },
    ]);

    const response = await handler(
      new Request(`https://app.plateful.cloud/api/share?token=${token}`)
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/html");
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=86400");
    expect(body).toContain("<title>Creamy Tomato Pasta · Plateful</title>");
    expect(body).toContain(`<meta property="og:image" content="${cover}" />`);
    expect(body).toContain(
      `<meta property="og:url" content="https://app.plateful.cloud/share/${token}" />`
    );
    expect(body).toContain('<div id="root"></div>');
    expect(calls[1]).toBe(`${projectUrl}/rest/v1/rpc/resolve_recipe_share`);
  });

  it("serves the plain shell for a miss, briefly cached", async () => {
    fakeNetwork([]);

    const response = await handler(
      new Request(`https://app.plateful.cloud/api/share?token=${token}`)
    );
    const body = await response.text();

    expect(body).toBe(shell);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=60");
  });

  it("does not ask the resolver about a token that cannot exist", async () => {
    const calls = fakeNetwork([]);

    const response = await handler(
      new Request("https://app.plateful.cloud/api/share?token=../../etc/passwd")
    );

    expect(await response.text()).toBe(shell);
    expect(calls).toHaveLength(1);
  });

  it("serves the plain shell when the resolver fails", async () => {
    fakeNetwork({ error: "boom" }, 500);

    const response = await handler(
      new Request(`https://app.plateful.cloud/api/share?token=${token}`)
    );

    expect(await response.text()).toBe(shell);
  });
});
