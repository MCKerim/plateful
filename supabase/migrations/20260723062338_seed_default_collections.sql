-- Seed a set of default collections ("folders") whenever a new household is
-- created, named in the household's language. The household's language is taken
-- from its owner's `users.language` (the same value that drives AI content and
-- push), defaulting to English.
--
-- Fires only on INSERT, so existing households are never touched. Runs for every
-- client (native iOS, Capacitor, Android) with no client-side code, because it
-- hangs off the `household` row insert itself.
--
-- SECURITY DEFINER is required: at AFTER INSERT time the creator's
-- `users.household_id` still points at their previous household (clients update
-- it in a separate step *after* inserting the household row), so the
-- `collections` INSERT RLS policy would reject these rows if run as the invoking
-- user. Running as the definer (table owner) bypasses RLS. `color_hex` is filled
-- automatically from `color_key` by the existing `collections_sync_color_storage`
-- trigger, so we only set `color_key` here.
--
-- Seeding is best-effort: the whole body is wrapped in an exception handler so a
-- failure here can never roll back the household insert it hangs off. Default
-- folders are cosmetic; household creation sits in the critical signup path and
-- must not depend on them.

CREATE OR REPLACE FUNCTION public.seed_default_collections()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_lang text;
BEGIN
  SELECT coalesce(u.language, 'en') INTO v_lang
  FROM public.users u
  WHERE u.id = NEW.owner_id;

  -- No matching user row leaves v_lang NULL (coalesce only fires on a hit).
  IF v_lang IS NULL THEN
    v_lang := 'en';
  END IF;

  IF v_lang = 'de' THEN
    INSERT INTO public.collections (household_id, created_by, name, color_key, sticker_key)
    VALUES
      (NEW.id, NEW.owner_id, 'Frühstück',    'gold',  'fried_egg'),
      (NEW.id, NEW.owner_id, 'Hauptgericht', 'green', 'place_setting'),
      (NEW.id, NEW.owner_id, 'Dessert',      'rose',  'cake'),
      (NEW.id, NEW.owner_id, 'Getränke',     'teal',  'cocktail');
  ELSE
    INSERT INTO public.collections (household_id, created_by, name, color_key, sticker_key)
    VALUES
      (NEW.id, NEW.owner_id, 'Breakfast',    'gold',  'fried_egg'),
      (NEW.id, NEW.owner_id, 'Main Course',  'green', 'place_setting'),
      (NEW.id, NEW.owner_id, 'Dessert',      'rose',  'cake'),
      (NEW.id, NEW.owner_id, 'Drinks',       'teal',  'cocktail');
  END IF;

  RETURN NULL; -- AFTER trigger: return value is ignored
EXCEPTION
  WHEN OTHERS THEN
    -- Never let a seeding failure abort the household creation it hangs off.
    RAISE WARNING 'seed_default_collections failed for household %: %', NEW.id, SQLERRM;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS household_seed_default_collections ON public.household;

CREATE TRIGGER household_seed_default_collections
AFTER INSERT ON public.household
FOR EACH ROW
EXECUTE FUNCTION public.seed_default_collections();
