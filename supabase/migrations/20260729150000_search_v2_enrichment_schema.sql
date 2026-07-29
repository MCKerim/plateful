-- Search v2, part 1/2: enrichment schema — tags, ingredient slugs, the
-- ingredients reference table, and tags folded into the search document.
-- Design: iOS repo docs/search-design.md. Additive; existing clients unaffected.

alter table public.recipes
  add column if not exists tags text[] not null default '{}',
  add column if not exists total_time_minutes integer,
  add column if not exists enriched_at timestamptz;

alter table public.recipe_ingredients
  add column if not exists ingredient_slug text;

-- Canonical ingredient reference, machine-populated: the enrichment worker
-- inserts a row the first time a slug appears (LLM fills every field; all
-- correctable later). Search needs slug + contains_slugs; the rest is
-- deliberate groundwork for the future shopping-list feature (merge lines via
-- slug, display in household language, group by aisle, hide staples).
create table if not exists public.ingredients (
  slug           text primary key,
  name_en        text not null,
  name_de        text not null,
  -- Shopping aisle: produce | dairy | meat-fish | pantry | spices | frozen |
  -- bakery | drinks | other.
  category       text not null default 'other',
  -- Foods this compound contains, for exclusion safety: excluding `peanut`
  -- must drop `peanut-butter`, excluding `milk` must NOT drop `coconut-milk`.
  contains_slugs text[] not null default '{}',
  -- Pantry staples (salt, water, oil …) a shopping list can assume at home.
  is_staple      boolean not null default false,
  created_at     timestamptz not null default now()
);

alter table public.ingredients enable row level security;
-- Global reference data: readable by every signed-in user, written only by the
-- worker (service role, which bypasses RLS) — so no write policies at all.
create policy "ingredients are readable by signed-in users"
  on public.ingredients for select to authenticated using (true);

-- Fold slugs into the searchable ingredient text (hyphens spaced so
-- "peanut-butter" also matches "peanut butter"). The recipe_ingredients sync
-- trigger already calls this; the worker's slug writes re-fire it per row.
create or replace function public.recompute_recipe_ingredients_text(rid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update recipes
  set ingredients_text = (
    select string_agg(
             distinct concat_ws(' ', ingredient_name, replace(ingredient_slug, '-', ' ')),
             ' ')
    from recipe_ingredients
    where recipe_id = rid
  )
  where id = rid;
$$;

-- array_to_string() is only STABLE; generated columns need IMMUTABLE. Safe to
-- freeze for text[] (same reasoning as f_unaccent).
create or replace function public.f_array_to_string(arr text[], sep text)
returns text
language sql immutable parallel safe
as $$
  select array_to_string(arr, sep)
$$;

-- Rebuild the search document with tags at weight 'C' (a generated column's
-- expression can't be altered in place). Dropping the column drops its GIN
-- index; both are recreated below. The search_recipes function body is
-- $$-quoted (no stored dependency), so the drop does not cascade to it.
alter table public.recipes drop column if exists search_tsv;
alter table public.recipes add column search_tsv tsvector
  generated always as (
    setweight(to_tsvector('simple', public.f_unaccent(coalesce(name, ''))), 'A') ||
    setweight(to_tsvector('simple', public.f_unaccent(coalesce(ingredients_text, ''))), 'B') ||
    setweight(to_tsvector('simple', public.f_array_to_string(coalesce(tags, '{}'), ' ')), 'C') ||
    setweight(to_tsvector('simple', public.f_unaccent(coalesce(description, ''))), 'D')
  ) stored;

create index recipes_search_tsv_idx on public.recipes using gin (search_tsv);

-- The enrichment sweep's work query. PostgREST filters can't compare two
-- columns, so the staleness predicate lives here. Oldest debt first: never
-- enriched, then longest-stale.
create or replace function public.recipes_needing_enrichment(p_limit integer default 20)
returns setof uuid
language sql
stable
set search_path = public
as $$
  select id from recipes
  where enriched_at is null or enriched_at < updated_at
  order by enriched_at asc nulls first, updated_at asc
  limit least(greatest(coalesce(p_limit, 20), 1), 100)
$$;

revoke execute on function public.recipes_needing_enrichment(integer) from public, anon, authenticated;
grant execute on function public.recipes_needing_enrichment(integer) to service_role;
