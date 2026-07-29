-- Search v2, part 2/2: structured filters on the search_recipes RPC.
-- Postgres identifies functions by name+argtypes, so CREATE OR REPLACE with new
-- parameters would create an ambiguous overload — the v1 signature is dropped
-- and recreated with the v2 parameters instead. Every new parameter defaults to
-- null, so the deployed v1 callers (app, MCP server) keep working unchanged.
--
-- Filters are hard constraints; ranking never overrides them.
-- Ingredient filters are contains-aware via ingredients.contains_slugs:
-- excluding `peanut` drops `peanut-butter`, excluding `milk` keeps
-- `coconut-milk`; including `chicken` matches `chicken-breast`.
-- Caveat by design: rows whose ingredient_slug is still null (not yet
-- enriched, or junk lines) are invisible to the ingredient filters.

drop function if exists public.search_recipes(text, uuid, integer, integer);

create function public.search_recipes(
  p_text                text     default null,
  p_collection_id       uuid     default null,
  p_limit               integer  default 30,
  p_offset              integer  default 0,
  p_include_ingredients text[]   default null,
  p_exclude_ingredients text[]   default null,
  p_tags                text[]   default null,
  p_max_total_minutes   integer  default null,
  p_max_calories        integer  default null,
  p_min_protein_g       integer  default null
)
returns table (
  id                 uuid,
  name               character varying,
  description        text,
  created_at         timestamptz,
  status             text,
  base_servings      integer,
  servings_unit      text,
  avg_rating         numeric,
  image_path         text,
  cover_pending      boolean,
  import_id          uuid,
  tags               text[],
  total_time_minutes integer,
  rank               real
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with input as (
    select nullif(btrim(p_text), '') as txt
  ),
  q as (
    -- websearch_to_tsquery: user input can never produce tsquery syntax errors.
    select txt,
           websearch_to_tsquery('simple', public.f_unaccent(txt)) as tsq,
           public.f_unaccent(lower(txt)) as raw
    from input
  )
  select rw.id, rw.name, rw.description, rw.created_at, rw.status,
         rw.base_servings, rw.servings_unit, rw.avg_rating, rw.image_path,
         rw.cover_pending, rw.import_id,
         r.tags, r.total_time_minutes,
         (case
            when q.txt is null then 0
            else ts_rank(r.search_tsv, q.tsq)
               -- word_similarity, not similarity: the query is short and
               -- ingredients_text is long, and non-strict word_similarity also
               -- catches German compounds ("Suppe" in "Kartoffelsuppe").
               + 0.4 * greatest(
                   word_similarity(q.raw, public.f_unaccent(lower(rw.name))),
                   word_similarity(q.raw, public.f_unaccent(lower(coalesce(r.ingredients_text, '')))))
          end)::real as rank
  from public.recipes_with_rating rw
  join public.recipes r on r.id = rw.id
  cross join q
  where rw.status = 'ready'
    and (p_collection_id is null or exists (
          select 1 from public.recipe_collections rc
          where rc.recipe_id = rw.id and rc.collection_id = p_collection_id))
    -- Every requested ingredient present (directly or inside a compound).
    and (p_include_ingredients is null or not exists (
          select 1 from unnest(p_include_ingredients) as want(slug)
          where not exists (
            select 1
            from public.recipe_ingredients ri
            left join public.ingredients ing on ing.slug = ri.ingredient_slug
            where ri.recipe_id = rw.id
              and (ri.ingredient_slug = want.slug
                   or want.slug = any(coalesce(ing.contains_slugs, '{}')))
          )))
    -- None of the excluded ingredients present (directly or inside a compound).
    and (p_exclude_ingredients is null or not exists (
          select 1
          from public.recipe_ingredients ri
          left join public.ingredients ing on ing.slug = ri.ingredient_slug
          where ri.recipe_id = rw.id
            and (ri.ingredient_slug = any(p_exclude_ingredients)
                 or exists (select 1 from unnest(p_exclude_ingredients) x
                            where x = any(coalesce(ing.contains_slugs, '{}'))))))
    -- All requested tags present.
    and (p_tags is null or r.tags @> p_tags)
    -- Numeric constraints exclude recipes with no value: a recipe without a
    -- known time cannot claim to be "under 30 minutes".
    and (p_max_total_minutes is null or r.total_time_minutes <= p_max_total_minutes)
    and (p_max_calories is null or r.calories_kcal <= p_max_calories)
    and (p_min_protein_g is null or r.protein_g >= p_min_protein_g)
    and (q.txt is null
         or r.search_tsv @@ q.tsq
         or word_similarity(q.raw, public.f_unaccent(lower(rw.name))) > 0.45
         or word_similarity(q.raw, public.f_unaccent(lower(coalesce(r.ingredients_text, '')))) > 0.45)
  order by rank desc, rw.created_at desc, rw.id desc
  limit least(greatest(coalesce(p_limit, 30), 1), 51)   -- 51 = MCP max 50 + its hasMore row
  offset greatest(coalesce(p_offset, 0), 0)
$$;

-- Recreate the v1 grants on the new signature (drop+create resets them).
revoke execute on function public.search_recipes(text, uuid, integer, integer, text[], text[], text[], integer, integer, integer) from public, anon;
grant execute on function public.search_recipes(text, uuid, integer, integer, text[], text[], text[], integer, integer, integer) to authenticated, service_role;
