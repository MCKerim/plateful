-- recipe_imports.error_code: a machine-readable failure code next to the
-- free-text `error`, so clients can show specific copy and hide useless
-- actions (e.g. no "Try again" for a private Instagram post). Written only by
-- the extractor worker (imports/errors.ts in recipe-extractor); clients read it.
--
-- Values: 'source_unavailable' (the post/page is private, removed, or blocks
-- automated access; a retry repeats it), 'no_recipe' (the source was read and
-- had no recipe), NULL (anything else: a system failure or timeout, retryable).
-- Deliberately an open text column rather than an enum/CHECK so a new code is
-- a worker change, not a migration.

alter table public.recipe_imports
  add column if not exists error_code text;

comment on column public.recipe_imports.error_code is
  'Machine-readable failure code for clients: source_unavailable | no_recipe | NULL (other). Set by the extractor worker when status = failed.';

-- A retry starts the row over, so the code goes with the text.
create or replace function public.retry_import(p_import_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
begin
  update public.recipe_imports
     set status = 'importing', attempts = 0, error = null, error_code = null
   where id = p_import_id
     and status = 'failed'
     and household_id in (
       select users.household_id from public.users where users.id = auth.uid()
     );
end;
$function$;
