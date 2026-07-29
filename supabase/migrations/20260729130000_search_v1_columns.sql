-- Search v1, part 1/2: keyword-search infrastructure on recipes.
-- Design: iOS repo docs/search-design.md + docs/search-plan.md (B1).
-- Additive only — existing clients are unaffected.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists moddatetime with schema extensions;

-- unaccent() is STABLE, but generated columns and index expressions require
-- IMMUTABLE. Freezing the explicit-dictionary form is the standard safe wrapper.
create or replace function public.f_unaccent(text)
returns text
language sql immutable parallel safe strict
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, $1)
$$;

alter table public.recipes
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists ingredients_text text;

-- Staleness signal for search v2's enrichment sweep (and general hygiene).
create trigger recipes_updated_at
  before update on public.recipes
  for each row execute function extensions.moddatetime(updated_at);

-- Weighted search document: title > ingredients > (tags, v2) > description.
alter table public.recipes add column if not exists search_tsv tsvector
  generated always as (
    setweight(to_tsvector('simple', public.f_unaccent(coalesce(name, ''))), 'A') ||
    setweight(to_tsvector('simple', public.f_unaccent(coalesce(ingredients_text, ''))), 'B') ||
    -- 'C' is reserved for tags (search v2)
    setweight(to_tsvector('simple', public.f_unaccent(coalesce(description, ''))), 'D')
  ) stored;

create index if not exists recipes_search_tsv_idx
  on public.recipes using gin (search_tsv);
create index if not exists recipes_name_trgm_idx
  on public.recipes using gin (name extensions.gin_trgm_ops);
create index if not exists recipes_ingredients_trgm_idx
  on public.recipes using gin (ingredients_text extensions.gin_trgm_ops);

-- recipes.ingredients_text is derived from recipe_ingredients and kept fresh
-- by a trigger. SECURITY DEFINER (pinned search_path, no dynamic SQL) so the
-- sync never depends on the writing role also having UPDATE on recipes.
create or replace function public.recompute_recipe_ingredients_text(rid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update recipes
  set ingredients_text = (
    select string_agg(distinct ingredient_name, ' ')
    from recipe_ingredients
    where recipe_id = rid
  )
  where id = rid;
$$;

create or replace function public.sync_recipe_ingredients_text()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recompute_recipe_ingredients_text(coalesce(new.recipe_id, old.recipe_id));
  -- An ingredient row moving between recipes must refresh both sides.
  if tg_op = 'UPDATE' and old.recipe_id is distinct from new.recipe_id then
    perform public.recompute_recipe_ingredients_text(old.recipe_id);
  end if;
  return null;
end;
$$;

create trigger recipe_ingredients_sync_text
  after insert or update or delete on public.recipe_ingredients
  for each row execute function public.sync_recipe_ingredients_text();

-- These run as owner; nobody needs to call them directly.
revoke execute on function public.recompute_recipe_ingredients_text(uuid) from public, anon, authenticated;
revoke execute on function public.sync_recipe_ingredients_text() from public, anon, authenticated;

-- Backfill the existing stock (recomputes search_tsv as a side effect).
update public.recipes r
set ingredients_text = sub.txt
from (
  select recipe_id, string_agg(distinct ingredient_name, ' ') as txt
  from public.recipe_ingredients
  group by recipe_id
) sub
where sub.recipe_id = r.id;
