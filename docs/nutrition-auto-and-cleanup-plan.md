# Web/Android pass: automatic nutrition + the standing cleanup batch

Planned AND implemented 2026-08-24 (with Claude), after iOS shipped
automatic nutrition updates — kept as the record of the decisions. Ship in
the next Android release (versionCode 36); web deploys on push. Server work is DONE — columns, worker job,
and `POST /api/nutrition/refresh` are live (contract:
`plateful-ios/docs/system-architecture.md`).

## Context

Since 2026-08-24 the backend re-estimates a recipe's 7 per-serving nutrition
columns automatically:

- `recipes.nutrition_auto` (bool, default true) — on: the backend owns the
  values and re-estimates when ingredients change; off: the user manages
  them by hand and NOTHING may overwrite them.
- `recipes.nutrition_pending` (bool) — an estimate is queued/running; drives
  a loading state on the nutrition card (`cover_pending`'s twin). Imports
  now insert with it set and get their values seconds after going `ready`.
- `POST https://extractor.plateful.cloud/api/nutrition/refresh`
  `{ recipe_id }`, `Authorization: Bearer <supabase access token>` — flags
  pending + enqueues the overwriting estimate job. Idempotent while
  pending; 202 always; recipe must be in the caller's household.

iOS replaced its Calculate button with an "Update automatically" toggle.
This pass brings the web/Android client to parity. Until it ships, web
edits simply don't auto-update (status quo) — nothing breaks.

## Workstream A — adopt automatic nutrition

**A1. Types + reads.** Regenerate `src/types/database.types.ts` (the two new
columns exist in prod). The single-recipe fetch uses `select("*")`
(`recipe.api.ts:46`), so both flags flow in for free; check the cookbook
list query (the `recipes_with_rating` view now carries both at the end).

**A2. Editor (`NutritionEditor.tsx`).** Add the toggle
("Update automatically" / "Automatisch aktualisieren"), bound to
`nutrition_auto`:
- ON: the 7 inputs disabled, Calculate (Sparkles) button GONE.
- OFF: inputs editable; saving writes the 7 columns + `nutrition_auto=false`.
- Flipping ON is the re-estimate gesture: save `nutrition_auto=true`, then
  call refresh.
- **Hard rule (learned from the iOS review): while auto is ON, recipe
  update payloads must NOT include the 7 columns** — writing the client's
  snapshot back races an estimate that landed mid-edit and erases it.
  `recipe.api.ts` already avoids wiping estimates on unrelated updates
  (comment near line 117) — verify and keep that shape.

**A3. Refresh trigger.** New `nutritionApi.refresh(supabase, recipeId)`
(same transport as the old `estimate`, new endpoint). Call it after a save
when, with auto ON (mirror iOS `RecipeEditStore.nutritionPlan()`):
- the ingredient lines changed — compare **order-insensitively** (a pure
  reorder changes no food and must not burn an LLM call), or
- the toggle was just (re-)enabled, or
- all 7 values are empty (first estimate for legacy rows — ~207 recipes
  predate `recipe_ingredients`, plus any never-calculated recipe).

Not a trigger: servings-only change with existing values → local
deterministic rescale (`new = old × oldServings/newServings`, whole
kcal/mg, grams to one decimal), written with the save. The detail page's
"set as default" servings scaling (`scale_recipe_servings` RPC) rescales
quantities proportionally, so per-serving values stay correct — no action
there, same as iOS. Emptying the ingredient list clears the 7 columns.

**A4. Display (`NutritionSection.tsx` / `Recipe.tsx`).** Show the card
while `nutrition_pending` even when values are null: soft pulse +
"Updating nutrition…" note (iOS look: no spinner, calm opacity breath).
Resolution needs no new plumbing — `App.tsx:279` already subscribes to
`recipes` postgres_changes → `scheduleRefresh`, and the refetch carries the
value columns.

**A5. Analytics.** Drop the `nutritionCalculated` capture with the button;
add `nutrition_auto_toggled { enabled }` when an EDIT changes the flag
(never on create — it would pollute the abandonment metric). Update the
cross-repo contract doc `plateful-ios/docs/analytics.md` when this ships.

**A6. Retirements.** Delete `useEstimateNutrition.ts`; replace
`nutritionApi.estimate` with `refresh` (keep the `NutritionValues` types).
The extractor's `/api/nutrition/estimate` route stays live until installed
Android builds drain (the `household_subscriptions` lesson: old APKs call
old routes for weeks) — revisit removal only after adoption shows in the
release metrics.

## Workstream B — the standing 2026-08-23 cleanup batch

**B1. Remove Retry.** `ImportCard.tsx` drops the Retry button;
`recipeImport.api.ts` drops `retryImport`. The worker never retries — the
button re-ran a job that provably never succeeds twice. Leave the
`retry_import` RPC in the database for old installed clients; mark it for
much-later removal.

**B2. Failure copy off `error_code`.** ImportCard's failed state keys its
message on `recipe_imports.error_code`: `source_unavailable` (post/page is
private, removed, or blocks robots), `unreachable` (bad host/TLS),
`no_recipe` (nothing to extract), else the generic line. EN + DE strings;
codes documented in `plateful-ios/docs/system-architecture.md`.

**B3. Photo cap 4 → 8.** `ImageImport.tsx` `MAX_IMPORT_IMAGES = 8`, and fix
its stale comment (it claims iOS enforces 4; iOS and the server CHECK moved
to 8 on 08-23).

**B4. Deleted-recipe page crash.** `recipe.api.ts:46`'s
`.single()` throws "Cannot coerce the result to a single JSON object" when
the recipe is gone (Celine hit this twice). Switch to `.maybeSingle()` and
give `Recipe.tsx` a friendly "This recipe is gone" state (mirror iOS copy).
Audit the file's other `.single()` recipe reads (lines ~57/78/101/122) for
the same vanishing-row hazard.

## Sequencing & verification

1. Regenerate types, then B1–B4 (independent, low risk), then A2–A5.
2. Verify on web dev build: two browsers — edit ingredients in one, watch
   pending → values arrive in the other via realtime refetch; run a text
   import and watch the card go pending → filled; toggle off, type values,
   edit an ingredient elsewhere, confirm values survive.
3. Android release: versionCode 36 (keystore is rescued; Play release
   unblocked). Web deploys with the same commit (Vercel).
4. Close out: update `plateful-ios/docs/analytics.md`, tick the batch in
   the iOS session memory.

Estimated effort: A ≈ a day, B ≈ half a day, shared verification pass.
