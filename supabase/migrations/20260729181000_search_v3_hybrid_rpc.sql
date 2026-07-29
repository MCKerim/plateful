-- Search v3, part 2/2: hybrid ranking — the semantic leg joins the keyword
-- legs, plus the small taste boosts (v4 pulled forward). Design: iOS repo
-- docs/search-design.md.
--
-- The query's embedding arrives pre-computed (the `search` edge function
-- embeds the text; the app calls it, MCP keeps calling the RPC directly and
-- simply searches without the semantic leg). It travels as text and is cast
-- once — PostgREST's JSON-to-vector coercion is not something to depend on.
--
-- Boosts (rating, times cooked) apply ONLY in the text branch: browsing stays
-- exactly newest-first with the id tie-break the MCP cursor relies on.
-- New parameter = new signature: drop + recreate + re-grant.

drop function if exists public.search_recipes(text, uuid, integer, integer, text[], text[], text[], integer, integer, integer);

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
  p_min_protein_g       integer  default null,
  p_embedding           text     default null
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
           public.f_unaccent(lower(txt)) as raw,
           (case when p_embedding is null then null
                 else p_embedding::extensions.vector(1536) end) as qe
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
               -- the local filter's semantics, mirrored (live-typing superset)
               + 0.25 * (case when public.f_unaccent(lower(rw.name)) like '%' || q.raw || '%'
                              then 1 else 0 end)
               -- semantic leg: cosine similarity above a noise floor. A strong
               -- meaning-only match (~0.55 sim) scores ~0.24 — visible, but
               -- below any direct keyword hit.
               + (case when q.qe is not null and r.embedding is not null
                       then 0.8 * greatest(0, 1 - (r.embedding <=> q.qe) - 0.25)
                       else 0 end)
               -- taste boosts: the household's own ratings and cooking history
               -- nudge loved recipes up between otherwise-similar matches.
               + 0.15 * coalesce(rw.avg_rating, 0) / 5
               + 0.1 * least((select count(*) from public.cooking_sessions cs
                              where cs.recipe_id = rw.id and cs.status = 'finished'), 5) / 5.0
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
    -- Numeric constraints exclude recipes with no value.
    and (p_max_total_minutes is null or r.total_time_minutes <= p_max_total_minutes)
    and (p_max_calories is null or r.calories_kcal <= p_max_calories)
    and (p_min_protein_g is null or r.protein_g >= p_min_protein_g)
    and (q.txt is null
         or r.search_tsv @@ q.tsq
         or public.f_unaccent(lower(rw.name)) like '%' || q.raw || '%'
         or word_similarity(q.raw, public.f_unaccent(lower(rw.name))) > 0.45
         or word_similarity(q.raw, public.f_unaccent(lower(coalesce(r.ingredients_text, '')))) > 0.45
         -- semantic-only matches: close enough in meaning even with zero
         -- keyword overlap ("cozy soup" → Suppen).
         or (q.qe is not null and r.embedding is not null and (r.embedding <=> q.qe) < 0.6))
  order by rank desc, rw.created_at desc, rw.id desc
  limit least(greatest(coalesce(p_limit, 30), 1), 51)   -- 51 = MCP max 50 + its hasMore row
  offset greatest(coalesce(p_offset, 0), 0)
$$;

revoke execute on function public.search_recipes(text, uuid, integer, integer, text[], text[], text[], integer, integer, integer, text) from public, anon;
grant execute on function public.search_recipes(text, uuid, integer, integer, text[], text[], text[], integer, integer, integer, text) to authenticated, service_role;
