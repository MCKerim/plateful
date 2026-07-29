import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Recipe search (search v3 — iOS repo docs/search-design.md): embeds the query
// text (text-embedding-3-small, multilingual — the semantic leg's whole point)
// and calls the `search_recipes` RPC with the caller's own JWT, so RLS scopes
// results exactly as if the app had called PostgREST directly. The function
// adds no auth logic of its own.
//
// Degrades gracefully: if the embedding call fails or times out, the search
// runs keyword-only — search never hard-fails because an AI dependency
// hiccuped. Browsing (no text) skips the embedding entirely.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

  const embedding = text.length > 0 ? await embedQuery(text) : null;

  const { data, error } = await supabase.rpc("search_recipes", {
    p_text: text || null,
    p_collection_id: body.collection_id ?? null,
    p_limit: body.limit ?? 30,
    p_include_ingredients: body.include_ingredients ?? null,
    p_exclude_ingredients: body.exclude_ingredients ?? null,
    p_tags: body.tags ?? null,
    p_max_total_minutes: body.max_total_minutes ?? null,
    p_max_calories: body.max_calories ?? null,
    p_min_protein_g: body.min_protein_g ?? null,
    p_embedding: embedding,
  });
  if (error) return json({ error: error.message }, 500);

  // The RPC's rows, verbatim — the app decodes them exactly like a direct
  // PostgREST response.
  return json(data ?? []);
});
