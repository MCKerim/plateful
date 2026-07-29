-- Review-pass fix (2026-07-29): the enrichment sweep re-enqueues still-stale
-- recipes every minute, and pg-boss's stately policy only dedupes QUEUED jobs —
-- a recipe being actively processed gets re-queued and run a second time, at
-- two LLM calls per wasted run. The job now asks the database whether the
-- recipe is still stale before doing any work; the predicate lives here because
-- it compares two columns (PostgREST filters can't) and must be
-- microsecond-exact (JS Date comparison isn't).

create or replace function public.recipe_needs_enrichment(p_recipe_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from recipes
    where id = p_recipe_id
      and (enriched_at is null or enriched_at < updated_at or embedding is null)
  )
$$;

revoke execute on function public.recipe_needs_enrichment(uuid) from public, anon, authenticated;
grant execute on function public.recipe_needs_enrichment(uuid) to service_role;
