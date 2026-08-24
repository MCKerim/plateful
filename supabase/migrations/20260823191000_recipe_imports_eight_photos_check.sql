-- Companion to 20260823190000_recipe_imports_eight_photos: the row-shape CHECK
-- also capped image imports at 4 source_refs. Same definition, 4 -> 8 (and the
-- jsonb text cap grows with it: 8 refs of ~80 chars each are well under 4096,
-- left as is).

alter table public.recipe_imports
  drop constraint if exists recipe_imports_source_shape_check;

alter table public.recipe_imports
  add constraint recipe_imports_source_shape_check check (
    case source_type
      when 'url' then (
        source_url is not null
        and char_length(source_url) >= 1 and char_length(source_url) <= 2048
        and source_url ~ '^https://'
        and source_url !~ '[[:space:][:cntrl:]]'
        and source_url !~ '^https://[^/]*@'
        and source_refs is null
        and source_text is null
      )
      when 'image' then (
        source_url is null
        and source_text is null
        and source_refs is not null
        and jsonb_typeof(source_refs) = 'array'
        and jsonb_array_length(source_refs) >= 1 and jsonb_array_length(source_refs) <= 8
        and octet_length(source_refs::text) <= 4096
      )
      when 'text' then (
        source_url is null
        and source_refs is null
        and source_text is not null
        and char_length(btrim(source_text)) >= 1 and char_length(btrim(source_text)) <= 20000
      )
      else false
    end
  );
