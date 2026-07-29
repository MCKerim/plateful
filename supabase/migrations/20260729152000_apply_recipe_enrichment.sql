-- Search v2: the enrichment worker's final write. One function so
-- `enriched_at` is stamped with DATABASE time in the same statement that
-- moddatetime bumps `updated_at` — both get the same now(), which keeps the
-- staleness predicate (`enriched_at < updated_at`) stable. Stamping from the
-- worker's clock instead could sit behind the DB clock and re-enroll every
-- recipe forever.

create or replace function public.apply_recipe_enrichment(
  p_recipe_id           uuid,
  p_tags                text[],
  p_total_time_minutes  integer
)
returns void
language sql
security definer
set search_path = public
as $$
  update recipes
  set tags = coalesce(p_tags, '{}'),
      total_time_minutes = p_total_time_minutes,
      enriched_at = now()
  where id = p_recipe_id;
$$;

revoke execute on function public.apply_recipe_enrichment(uuid, text[], integer) from public, anon, authenticated;
grant execute on function public.apply_recipe_enrichment(uuid, text[], integer) to service_role;
