# Realtime: one unpublished table fails the whole channel

_A `postgres_changes` subscription on a table that is not in the `supabase_realtime` publication makes Supabase reject the entire channel, so every other table on that channel stops updating too; check `pg_publication_tables` before adding a table to the `recipes-changes` channel in `App.tsx`._

Seen 2026-10-12 while wiring cooking mode: the channel in `src/App.tsx` got four cooking tables, but `cooking_session_participants` is not published (iOS never subscribed to it either; joins show on refetch). With that one `.on(...)` in place, nothing on the channel delivered, not recipes, not the plan, not the shopping list, and the app logged no error because `.subscribe()` has no status callback. Removing the table brought everything back.

**Rule.** Before subscribing to a table, confirm it is published and carries replica identity `full` (deletes need the old row to pass RLS):

```sql
select p.tablename, c.relreplident
from pg_publication_tables p
join pg_class c on c.relname = p.tablename
join pg_namespace n on n.oid = c.relnamespace and n.nspname = p.schemaname
where p.pubname = 'supabase_realtime' order by 1;
```

Published on 2026-10-12: collections, cooking_session_checks, cooking_session_timers, cooking_sessions, meal_planning, planner_notes, recipe_collections, recipe_imports, recipes, shopping_list_items (all `full`), users (default). Adding a table is a prod `ALTER PUBLICATION` through the Supabase connector, as the iOS repo's `realtime-filtered-deletes-need-replica-identity-full.md` describes.
