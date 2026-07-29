-- Search v1, part 2/2: the search_recipes RPC — the one search implementation
-- used by the iOS app and the MCP server (web app can adopt it later).
-- Design: iOS repo docs/search-design.md + docs/search-plan.md (B2).
--
-- SECURITY INVOKER + the security_invoker recipes_with_rating view means RLS
-- scopes results to the caller's household; the function adds no auth logic.
-- Browsing (p_text null) returns rank 0 for every row, so ordering degrades to
-- newest-first with the id tie-break the MCP cursor pagination relies on.

create or replace function public.search_recipes(
  p_text          text default null,
  p_collection_id uuid default null,
  p_limit         integer default 30,
  p_offset        integer default 0
)
returns table (
  id            uuid,
  name          character varying,
  description   text,
  created_at    timestamptz,
  status        text,
  base_servings integer,
  servings_unit text,
  avg_rating    numeric,
  image_path    text,
  cover_pending boolean,
  import_id     uuid,
  rank          real
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
    and (q.txt is null
         or r.search_tsv @@ q.tsq
         or word_similarity(q.raw, public.f_unaccent(lower(rw.name))) > 0.45
         or word_similarity(q.raw, public.f_unaccent(lower(coalesce(r.ingredients_text, '')))) > 0.45)
  order by rank desc, rw.created_at desc, rw.id desc
  limit least(greatest(coalesce(p_limit, 30), 1), 51)   -- 51 = MCP max 50 + its hasMore row
  offset greatest(coalesce(p_offset, 0), 0)
$$;

-- Search is meaningless signed-out; the default PUBLIC execute grant would
-- include anon, so replace it with an explicit grant.
revoke execute on function public.search_recipes(text, uuid, integer, integer) from public, anon;
grant execute on function public.search_recipes(text, uuid, integer, integer) to authenticated, service_role;
