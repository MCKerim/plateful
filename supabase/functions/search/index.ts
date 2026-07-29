import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Recipe search (search v3 — iOS repo docs/search-design.md): embeds the query
// text (text-embedding-3-small, multilingual) and — when the caller asks and
// the query looks like a sentence — parses it into structured constraints
// with a small OpenAI model ("low carb vegetarisch unter 30 min" → max_carbs_g +
// vegetarian + max_total_minutes). Both run concurrently, then one
// `search_recipes` RPC call under the caller's own JWT (RLS scopes results;
// this function adds no auth logic). Response: { results, parsed } — `parsed`
// echoes what the NL layer understood, which the app renders as chips.
//
// Degrades gracefully at every step: parse failure → no constraints, embed
// failure → keyword-only. Search never hard-fails because an AI dependency
// hiccuped.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Mirror of the closed tag vocabulary — source of truth:
// recipe-extractor/src/enrichment/vocabulary.ts. Keep in sync when adding tags.
const TAG_SLUGS = [
  "one-pot", "baked", "grilled", "fried", "air-fryer", "slow-cooked", "no-cook",
  "steamed", "stir-fried",
  "beginner-friendly", "meal-prep", "make-ahead", "freezer-friendly",
  "low-cleanup", "few-ingredients", "weeknight",
  "vegetarian", "vegan", "pescetarian", "gluten-free", "dairy-free",
  "creamy", "crispy", "spicy", "fresh-light", "hearty", "comfort-food", "sweet",
  "breakfast", "main", "side", "dessert", "snack", "drink",
];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

interface SearchRequest {
  q?: string;
  collection_id?: string;
  limit?: number;
  tags?: string[];
  max_total_minutes?: number;
  include_ingredients?: string[];
  exclude_ingredients?: string[];
  max_calories?: number;
  min_protein_g?: number;
  max_carbs_g?: number;
  /** Ask for the NL parse (the caller pre-gates; the server re-checks). */
  parse?: boolean;
}

/** What the NL layer extracted — echoed to the app for the "understood" chips. */
interface ParsedConstraints {
  tags: string[];
  include_ingredients: string[];
  exclude_ingredients: string[];
  max_total_minutes: number | null;
  max_calories: number | null;
  min_protein_g: number | null;
  max_carbs_g: number | null;
}

/** Query embedding in pgvector text form, or null to search keyword-only. */
async function embedQuery(text: string): Promise<string | null> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
      signal: AbortSignal.timeout(3_000),
    });
    if (!res.ok) return null;
    const payload = await res.json() as { data?: { embedding?: number[] }[] };
    const embedding = payload.data?.[0]?.embedding;
    return Array.isArray(embedding) ? `[${embedding.join(",")}]` : null;
  } catch {
    return null;
  }
}

const PARSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    text: { type: "string" },
    tags: { type: "array", items: { type: "string", enum: TAG_SLUGS } },
    include_ingredients: { type: "array", items: { type: "string" } },
    exclude_ingredients: { type: "array", items: { type: "string" } },
    max_total_minutes: { type: ["integer", "null"] },
    max_calories: { type: ["integer", "null"] },
    min_protein_g: { type: ["integer", "null"] },
    max_carbs_g: { type: ["integer", "null"] },
  },
  required: [
    "text", "tags", "include_ingredients", "exclude_ingredients",
    "max_total_minutes", "max_calories", "min_protein_g", "max_carbs_g",
  ],
};

const PARSE_PROMPT = `You turn a recipe-search query (German or English) into structured constraints for a meal-planning app.

Rules:
- "text": the residual dish/food words worth text-searching, WITHOUT the constraint words ("schnelle vegane Bowls ohne Nüsse" → "Bowls"). Empty string if the query is constraints only.
- "tags": only values that clearly apply, from the allowed list (diet words → vegetarian/vegan/pescetarian/gluten-free/dairy-free; methods → one-pot/baked/…; courses → breakfast/main/side/dessert/snack/drink; character → creamy/crispy/spicy/fresh-light/hearty/comfort-food/sweet).
- "include_ingredients"/"exclude_ingredients": canonical English food slugs, kebab-case, singular ("mit Hähnchen" → ["chicken"]; "ohne Erdnüsse" → ["peanut"]).
- Numbers: "unter 30 min"/"under 30 minutes" → max_total_minutes 30; "schnell"/"quick" with no number → max_total_minutes 30; "unter 600 kcal" → max_calories 600; "high protein"/"proteinreich" → min_protein_g 25; "low carb" → max_carbs_g 30.
- null / [] for anything not clearly requested. Never invent constraints.`;

/** Extracts constraints, or null when the parse fails/produces nothing. */
async function parseQuery(text: string): Promise<{ residual: string; parsed: ParsedConstraints } | null> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        // No explicit temperature: some 5.x tiers reject it, and a rejected
        // parse degrades SILENTLY to no-chips here.
        model: "gpt-5.4-nano",
        messages: [
          { role: "system", content: PARSE_PROMPT },
          { role: "user", content: text },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "search_constraints", strict: true, schema: PARSE_SCHEMA },
        },
      }),
      signal: AbortSignal.timeout(4_000),
    });
    if (!res.ok) return null;
    const payload = await res.json() as { choices?: { message?: { content?: string } }[] };
    const raw = JSON.parse(payload.choices?.[0]?.message?.content ?? "null") as
      | (ParsedConstraints & { text: string })
      | null;
    if (!raw) return null;

    const cleanSlugs = (values: unknown): string[] =>
      Array.isArray(values)
        ? values.filter((v): v is string => typeof v === "string" && SLUG_PATTERN.test(v))
        : [];
    const cleanNumber = (value: unknown): number | null =>
      typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.round(value) : null;

    const parsed: ParsedConstraints = {
      tags: cleanSlugs(raw.tags).filter((tag) => TAG_SLUGS.includes(tag)),
      include_ingredients: cleanSlugs(raw.include_ingredients),
      exclude_ingredients: cleanSlugs(raw.exclude_ingredients),
      max_total_minutes: cleanNumber(raw.max_total_minutes),
      max_calories: cleanNumber(raw.max_calories),
      min_protein_g: cleanNumber(raw.min_protein_g),
      max_carbs_g: cleanNumber(raw.max_carbs_g),
    };
    const hasAny = parsed.tags.length > 0
      || parsed.include_ingredients.length > 0
      || parsed.exclude_ingredients.length > 0
      || parsed.max_total_minutes != null
      || parsed.max_calories != null
      || parsed.min_protein_g != null
      || parsed.max_carbs_g != null;
    if (!hasAny) return null;

    return { residual: typeof raw.text === "string" ? raw.text.trim() : "", parsed };
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let body: SearchRequest;
  try {
    body = await req.json() as SearchRequest;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const text = (body.q ?? "").trim().slice(0, 200);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );

  // Embed the ORIGINAL query (a sentence embeds fine and this can run
  // concurrently with the parse); keyword-search the parse's residual text.
  // The app owns the parse gate (2+ words or digits); a parse that finds no
  // constraints is harmless, so the server just trusts the flag.
  const wantsParse = body.parse === true && text.length > 0;
  const [embedding, parseResult] = await Promise.all([
    text.length > 0 ? embedQuery(text) : Promise.resolve(null),
    wantsParse ? parseQuery(text) : Promise.resolve(null),
  ]);

  const parsed = parseResult?.parsed ?? null;
  // When the parse consumed the whole query into constraints, the search is a
  // filtered BROWSE (null text) — feeding the sentence back as keyword text
  // would demand recipes literally matching the constraint words.
  const searchText = parseResult ? parseResult.residual : text;

  // NL constraints join the caller's explicit filters; the stricter side wins.
  const union = (a?: string[], b?: string[]): string[] | null => {
    const merged = [...new Set([...(a ?? []), ...(b ?? [])])];
    return merged.length > 0 ? merged : null;
  };
  const minOf = (a?: number | null, b?: number | null): number | null =>
    a != null && b != null ? Math.min(a, b) : a ?? b ?? null;
  const maxOf = (a?: number | null, b?: number | null): number | null =>
    a != null && b != null ? Math.max(a, b) : a ?? b ?? null;

  const { data, error } = await supabase.rpc("search_recipes", {
    p_text: searchText || null,
    p_collection_id: body.collection_id ?? null,
    p_limit: body.limit ?? 30,
    p_include_ingredients: union(body.include_ingredients, parsed?.include_ingredients),
    p_exclude_ingredients: union(body.exclude_ingredients, parsed?.exclude_ingredients),
    p_tags: union(body.tags, parsed?.tags),
    p_max_total_minutes: minOf(body.max_total_minutes, parsed?.max_total_minutes),
    p_max_calories: minOf(body.max_calories, parsed?.max_calories),
    p_min_protein_g: maxOf(body.min_protein_g, parsed?.min_protein_g),
    p_max_carbs_g: minOf(body.max_carbs_g, parsed?.max_carbs_g),
    p_embedding: embedding,
  });
  if (error) return json({ error: error.message }, 500);

  // Chips display: resolve the parsed slugs to their localized names from the
  // ingredients reference table (readable under the caller's JWT); recipes the
  // enrichment hasn't rowed yet fall back to a prettified slug.
  let parsedForClient: unknown = null;
  if (parsed) {
    const pretty = (slug: string) =>
      slug.split("-").map((w) => (w[0]?.toUpperCase() ?? "") + w.slice(1)).join(" ");
    const slugs = [...new Set([...parsed.include_ingredients, ...parsed.exclude_ingredients])];
    const names = new Map<string, { name_en: string; name_de: string }>();
    if (slugs.length > 0) {
      const { data: rows } = await supabase
        .from("ingredients")
        .select("slug, name_en, name_de")
        .in("slug", slugs);
      for (const row of (rows ?? []) as { slug: string; name_en: string; name_de: string }[]) {
        names.set(row.slug, { name_en: row.name_en, name_de: row.name_de });
      }
    }
    const withNames = (slug: string) => ({
      slug,
      name_en: names.get(slug)?.name_en ?? pretty(slug),
      name_de: names.get(slug)?.name_de ?? pretty(slug),
    });
    parsedForClient = {
      ...parsed,
      include_ingredients: parsed.include_ingredients.map(withNames),
      exclude_ingredients: parsed.exclude_ingredients.map(withNames),
    };
  }

  return json({ results: data ?? [], parsed: parsedForClient });
});
