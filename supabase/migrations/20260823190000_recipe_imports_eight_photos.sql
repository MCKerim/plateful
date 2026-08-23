-- Photo imports may carry up to 8 images (was 4). The 4 was a limit of the
-- retired recipe-from-image edge function; the pg-boss worker reads a batch in
-- one vision call and its extractor accepts 8 (imageExtractor.ts MAX_IMAGES),
-- as do the iOS app (ImageImportStore.maxImages) and the share extension
-- (ShareImageEncoding.maxImages). The only change below is the staged-file
-- index in the source_refs regex: [0-3] -> [0-7]. Everything else is verbatim.

create or replace function private.enforce_recipe_import_submission()
 returns trigger
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_user_id uuid;
  v_recent_count integer;
  v_source_key text;
  v_ref_json jsonb;
  v_ref text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to create an import';
  end if;

  -- Worker-owned state cannot be forged through a manipulated client payload.
  new.created_by := v_user_id;
  new.status := 'importing';
  new.result_count := 0;
  new.error := null;
  new.attempts := 0;
  new.created_at := statement_timestamp();
  new.updated_at := statement_timestamp();

  if new.source_type = 'image' then
    for v_ref_json in
      select value
      from jsonb_array_elements(new.source_refs)
    loop
      if jsonb_typeof(v_ref_json) <> 'string' then
        raise exception using
          errcode = '22023',
          message = 'Image import references must be strings';
      end if;
      v_ref := v_ref_json #>> '{}';
      if char_length(v_ref) > 512
         or v_ref !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-7]\.jpg$'
         or split_part(v_ref, '/', 1) <> new.household_id::text then
        raise exception using
          errcode = '22023',
          message = 'Image import reference is invalid';
      end if;
    end loop;
  end if;

  -- Serialize equal submissions so two concurrent taps cannot both pass the
  -- duplicate check.
  v_source_key := case new.source_type
    when 'url' then new.source_url
    when 'text' then new.source_text
    when 'image' then new.source_refs::text
  end;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_user_id::text || ':' || new.source_type || ':' || v_source_key,
      0
    )
  );

  if exists (
    select 1
    from public.recipe_imports ri
    where ri.created_by = v_user_id
      and ri.source_type = new.source_type
      and ri.created_at >= statement_timestamp() - interval '5 minutes'
      and ri.status in ('importing', 'ready')
      -- A finished import stops blocking once the recipes it created are gone.
      -- Indexed by recipes_import_id_idx.
      and (
        ri.status = 'importing'
        or exists (
          select 1
          from public.recipes r
          where r.import_id = ri.id
        )
      )
      and (
        (new.source_type = 'url' and ri.source_url = new.source_url)
        or (new.source_type = 'text' and ri.source_text = new.source_text)
        or (new.source_type = 'image' and ri.source_refs = new.source_refs)
      )
  ) then
    raise exception using
      errcode = '23505',
      message = 'This import was already submitted recently';
  end if;

  select count(*) into v_recent_count
  from public.recipe_imports ri
  where ri.created_by = v_user_id
    and ri.status = 'importing';
  if v_recent_count >= 5 then
    raise exception using
      errcode = 'P0001',
      message = 'Too many imports are already processing';
  end if;

  select count(*) into v_recent_count
  from public.recipe_imports ri
  where ri.created_by = v_user_id
    and ri.created_at >= statement_timestamp() - interval '10 minutes';
  if v_recent_count >= 12 then
    raise exception using
      errcode = 'P0001',
      message = 'Import rate limit exceeded; try again later';
  end if;

  select count(*) into v_recent_count
  from public.recipe_imports ri
  where ri.created_by = v_user_id
    and ri.created_at >= statement_timestamp() - interval '1 day';
  if v_recent_count >= 60 then
    raise exception using
      errcode = 'P0001',
      message = 'Daily import limit exceeded';
  end if;

  select count(*) into v_recent_count
  from public.recipe_imports ri
  where ri.household_id = new.household_id
    and ri.created_at >= statement_timestamp() - interval '10 minutes';
  if v_recent_count >= 30 then
    raise exception using
      errcode = 'P0001',
      message = 'Household import rate limit exceeded; try again later';
  end if;

  select count(*) into v_recent_count
  from public.recipe_imports ri
  where ri.household_id = new.household_id
    and ri.created_at >= statement_timestamp() - interval '1 day';
  if v_recent_count >= 300 then
    raise exception using
      errcode = 'P0001',
      message = 'Household daily import limit exceeded';
  end if;

  return new;
end;
$function$;
