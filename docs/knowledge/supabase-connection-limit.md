# Supabase connection limit: 60 direct connections, shared by every service

_Exhausted twice so far, both on Micro compute and both found by the daily health check the next morning: 2026-10-06 17:54–18:04 UTC (five pg_cron runs refused, Realtime refused the Android app for a few minutes) and 2026-10-08 07:57–08:08 UTC (three cron runs refused). No user saw an error either time. The trigger is the Capacitor app's cookbook; fixed on `main` 2026-10-07 and live on the web, but Android runs the old build until the next Play release._

**The limit.** `max_connections` is 60 on Nano and Micro (90 on Small, 120 on Medium) and `superuser_reserved_connections` is 3, so a non-superuser (`postgres`, `authenticator`, `supabase_storage_admin`, `pgbouncer`, pg_cron's job connections) is refused with `FATAL: remaining connection slots are reserved for non-replication superuser connections` as soon as 57 regular backends exist. Realtime connects as the superuser `supabase_admin` but checks first and refuses to (re)connect the project while fewer than 12 slots are free (`DatabaseLackOfConnections: Only 4 available connections. At least 12 connections are required.`). Supabase lets you raise the limit (`supabase --experimental --project-ref upupcsgufoejppoietiu postgres-config update --config max_connections=N`; restarts the database and hard-codes the value across later resizes) but advises against it on 1 GB of RAM; the other way up is Small compute (2 GB, 90 connections).

**Who holds them.** Quiet baseline on 2026-10-07: 23 (the health check saw 27).

| Holder | Role | Quiet | Under load |
| --- | --- | --- | --- |
| Extractor's pg-boss, through Supavisor in session mode | `postgres`, app `Supavisor` | 10 (pg-boss's default pool) | 10; Supavisor's own pool is 15 |
| Realtime | `supabase_admin` | 6 + 1 walsender | drops them when no client is subscribed, needs 12 free to come back |
| PostgREST | `authenticator` | 2 | grows with API traffic, idle ones close after ~30 s |
| Storage, through the PgBouncer on the DB host (`pgbouncer_logs`) | `supabase_storage_admin` + `pgbouncer` for its auth query | 0 | ≥ 21 measured; idle ones stay **600 s** (`server_idle_timeout`) |
| Supabase's exporter, health checker, Auth, Supavisor's auth query | `supabase_admin`, `supabase_auth_admin`, `pgbouncer` | 4 | |
| pg_cron job runs, Supabase MCP and dashboard (`mgmt-api`) | `postgres` | 0 | 1 per running job or query |

**What happened on 2026-10-06** (UTC):

- 17:53:47 Celine's Galaxy (SM-S931B; she is the household's Android user, Kerim was in the iOS app that evening) opens the cookbook in the Android app: 780 × `GET /rest/v1/recipes?select=image_path&id=eq.<id>` and 511 × `GET /rest/v1/meal_planning?select=*&recipe_id=eq.<id>` by 17:59, 907 edge requests in the minute 17:54 alone, and 190 distinct cover images from Storage within three minutes. 188 Storage logins from 76 Storage instances reached PgBouncer in one minute; PgBouncer opened 13 `supabase_storage_admin` and 5 `pgbouncer` server connections.
- 17:54:11–17:59:16 three imports with their finish, annotate and enrich jobs ran in the extractor (pg-boss pool busy).
- 17:54:19 the two FATALs: PgBouncer's next storage connection and its next auth connection.
- 17:55:00 Realtime drops its connections ("no connected users"); 17:56:29–17:59:28 it refuses to come back, 22 attempts, 3–4 slots free each time (56–57 in use); streaming again before 18:05:38.
- pg_cron refused at 17:55, 17:59, 18:00, 18:02, 18:04 ("connection failed"): `recipe-storage-maintenance` ×2, `invoke-account-deletion-worker` ×2, `plan-reminder-dispatcher` ×1.
- 18:04:20 PgBouncer closes 17 idle server connections ("server idle timeout", age 600 s), the rest by 18:08:27. Every cron run from 18:05 on succeeds.

Impact: no 4xx or 5xx in the edge logs, every Storage request 200. The maintenance job is fire-and-forget and ran at 18:05; the deletion worker drained at 18:06; the plan-reminder window is an hour wide and claims once per day, so 18:04 sent whatever 17:59 would have. Realtime was gone for the app for five to ten minutes (supabase-js reconnects by itself).

**The repeat on 2026-10-08** (UTC), analysed 2026-10-09 from the health check's second finding (task `6hhwFfh2f6CPrrvC`): the same phone, the same cookbook, on the Android build from before the fix. (Both days were first written up as Kerim's Galaxy; the `auth_user` in the edge logs is Celine's account, corrected 2026-10-09.)

- 07:57:48–07:59:11 the Galaxy opens the cookbook: 1,105 per-card GETs (554 × `recipes?select=image_path&id=eq.<id>` and 551 × `meal_planning?select=*&recipe_id=eq.<id>` for 312 distinct recipes, so the old `RecipeCard` is still running there), the same number again as CORS preflights (the WebView's origin is not the API's; they carry no JWT and never reach the database), plus 256 cover requests for 239 distinct covers. Every cover came back `304` from the CDN, but each revalidation still reached Storage (`/object/info/public/recipeimages/…`): 94 + 92 Storage logins at PgBouncer in two minutes and 21 new `supabase_storage_admin`/`pgbouncer` server connections. Realtime reconnected at 07:57:50 (7 more). No import was running; the extractor only ran its minute sweeps.
- 07:58 FATAL for PgBouncer's auth connection; 08:00, 08:02 and 08:04 three pg_cron runs refused (`invoke-account-deletion-worker` ×2, `cooking-rating-push-dispatcher` ×1), each caught up by the next run; 08:07:50 Realtime drops its connections (no connected users); 08:08 PgBouncer closes 20 idle server connections after 600 s. Everything green from 08:05.
- Why it came back: the fix lives in the web bundle, and the Android app ships its own copy. The web has had it since Kerim's push on 2026-10-07 (Vercel); the phone still runs the build from before. Kerim uploaded Android 1.3 with the fix to Google Play on 2026-10-09; until Celine's phone has it, every open of the cookbook tab there more than an hour after the last one can repeat this; harmless so far.

**How often this happens.** Her everyday use is Home, planner and list: on 2026-10-07 ten visits with 8–28 `image_path` reads each (the planner's per-item cards) and at most 7 covers, nothing near the limit. Only the cookbook tab renders every card. She opened it on 10-04, 10-05, 10-06 and 10-08 (not on 10-07), and two of those four opens tipped the database over: the ones where the covers' one-hour cache had expired (`cache-control: max-age=3600` on every cover from before 2026-10-04; 204 + 202 origin requests at Storage in the four minutes of 10-08) and Realtime reconnected at the same time. A cookbook open within the hour costs 7 covers and nothing happens.

**Why that evening and not the other cookbook opens.** The storm itself happens most days: 1,057 and 2,017 card requests per hour on 10-04, 2,825 on 10-05 at 17:00, 792 on 10-06, all from the largest household (454 of 706 recipes; no other household comes close). On 10-05 17:27 the same storm met 7 Storage requests (covers cached on the device) and nothing happened. On 10-04 12:50 it met 209 Storage requests and PgBouncer opened 21 backends, still without a FATAL. On 10-06 the cover fan-out, three running imports and a connected Realtime added up. Whether a cold open fetches 7 or 190 covers depends on the device's HTTP cache and the CDN: the apps' own uploads (`recipeImage.api.ts`, iOS `RecipeImageLoader.swift`) and the extractor's covers since 2026-10-04 carry a one-year `cache-control`; extractor covers from before that (AI covers, imports) an hour, supabase-js's default (recipe-extractor `docs/knowledge/cover-upload-encoding.md`).

**The trigger: the cookbook renders every recipe and asks per card.** `src/page/Cookbook.tsx` maps all `searchResults` (every recipe while nothing is searched) plus six recently added into `RecipeCard`, no virtualization, the cover `<img>` without `loading="lazy"`. `src/components/general/RecipeCard.tsx` calls `useRecipeFirstImage(id)` (`recipes?select=image_path&id=eq.`, `recipeApi.getFirstImage`) and `useRecipeMealPlanInfo(id)` (`meal_planning?select=*&recipe_id=eq.`, `mealPlanningApi.getInfoByRecipe`): two round trips per card, repeated on every mount because the queries keep React Query's default `staleTime: 0`. Web and Android share this code; the native iOS app asks once (`image_path` inside its list query). 454 recipes ≈ 900 requests and up to 373 cover loads per open.

**The fix (2026-10-07).** A card asks the backend for nothing itself any more:

1. `cookbookApi.getRecipesWithRatings` selects `image_path`, `transformCookbookRecipes` turns it into `imageUrl` (`recipeImageUrl` in `recipe.api.ts`), and `RecipeCard` takes it as a prop: the 454 `image_path` queries are gone.
2. One household-wide read of `meal_planning` (`useRecipePlacements`, key `mealPlanning.recipePlacements`) feeds both the cards' status (`useRecipeMealPlanInfos` → `recipeMealPlanInfos`) and the "not planned in a while" sort (`useLastPlannedDates`), each as a React Query `select` on the same rows; `getInfoByRecipe` for the recipe page uses the same `recipeMealPlanInfo` rule, so the two readings cannot drift: the 454 plan queries are gone.
3. The card's cover `<img>` is `loading="lazy"`, so a cold open fetches the covers on screen, not all 373.

Opening the cookbook is now the list, the placements and the visible covers. On the web since the 2026-10-07 deploy; on Android with 1.3, uploaded to Google Play on 2026-10-09 (see the repeat above). Measured 2026-10-07 in Chromium against production with Kerim signed in (edge logs, UA Macintosh, and the page's Performance API): 454 cards rendered from 1 list request and 1 placements request, 15 covers fetched lazily instead of 373, zero per-card `meal_planning` or `image_path` requests; the only `image_path` single reads left are the Home page's planned-meal cards, one per visit. Kerim ruled out buying headroom with Small compute or a higher `max_connections` on 2026-10-07: with this few users, hitting 60 connections is a bug, not a capacity problem. The planner's own cards (`MealPlannerItem`, `TodaysMealCard`, `PlannedMealCard`) still use `useRecipeFirstImage` per item, which is one request per planned meal, a dozen or two a week, and was left alone.

**How to look next time.**

```sql
-- who holds connections right now
select application_name, usename, backend_type, state, count(*)
from pg_stat_activity group by 1, 2, 3, 4 order by 5 desc;

-- refused cron runs
select jobid, status, return_message, start_time
from cron.job_run_details where status = 'failed' order by start_time desc limit 20;
```

Logs (`query_logs`, one 24-hour window at a time): `postgres_logs` with `event_message like '%remaining connection slots%'` gives the minute; `pgbouncer_logs` with `event_message like 'S-%'` gives PgBouncer's server connections and their closing reason; `realtime_logs` with `like '%available connections%'` gives the free slots per attempt; `edge_logs` grouped by `splitByString(' | ', event_message)[3]` gives the storm's URLs; `storage_logs` the covers. Postgres keeps no connection history; the dashboard's Database Connections report (Observability) is the only chart.

Source: Supabase MCP (`execute_sql`, `query_logs`, `search_docs`) against production, the health-check task of 2026-10-07, the Capacitor and extractor repos; investigated 2026-10-07. The repeat was analysed the same way on 2026-10-09 from the health check's second finding.
