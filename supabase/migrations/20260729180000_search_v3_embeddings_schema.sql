-- Search v3, part 1/2: semantic embeddings on recipes.
-- Design: iOS repo docs/search-design.md ("v3 — semantic + NL").
--
-- The embedding is one more derived field in the existing enrichment pipeline:
-- the worker embeds a document of name + description + tags + ingredient
-- names/slugs (text-embedding-3-small, 1536 dims — multilingual, which is the
-- entire point: a German query must find English-ingredient recipes and vice
-- versa) and hands it to apply_recipe_enrichment. The sweep's work query now
-- also picks recipes with no embedding yet, so the whole backfill — and any
-- future gap — heals itself without a manual pass.

create extension if not exists vector with schema extensions;

alter table public.recipes
  add column if not exists embedding extensions.vector(1536);

-- Overkill at this corpus size, but cheap to maintain and correct at any size.
create index if not exists recipes_embedding_idx
  on public.recipes using hnsw (embedding extensions.vector_cosine_ops);

create or replace function public.recipes_needing_enrichment(p_limit integer default 20)
returns setof uuid
language sql
stable
set search_path = public
as $$
  select id from recipes
  where enriched_at is null or enriched_at < updated_at or embedding is null
  order by enriched_at asc nulls first, updated_at asc
  limit least(greatest(coalesce(p_limit, 20), 1), 100)
$$;

-- The final enrichment write gains the embedding. New parameter = new
-- signature, so the old function is dropped and grants re-applied. The vector
-- travels as its text form ("[0.1,0.2,…]") and is cast here — PostgREST's
-- JSON-to-vector coercion is not something to depend on. coalesce: an
-- enrichment run whose embed call failed must not wipe an existing embedding.
drop function if exists public.apply_recipe_enrichment(uuid, text[], integer);

create function public.apply_recipe_enrichment(
  p_recipe_id           uuid,
  p_tags                text[],
  p_total_time_minutes  integer,
  p_embedding           text default null
)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  update recipes
  set tags = coalesce(p_tags, '{}'),
      total_time_minutes = p_total_time_minutes,
      embedding = coalesce(p_embedding::vector, embedding),
      enriched_at = now()
  where id = p_recipe_id;
$$;

revoke execute on function public.apply_recipe_enrichment(uuid, text[], integer, text) from public, anon, authenticated;
grant execute on function public.apply_recipe_enrichment(uuid, text[], integer, text) to service_role;
