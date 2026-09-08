# Planner notes on Capacitor (web + Android)

Plan, 2026-09-07. Status: implemented the same day (steps 1 to 7; step 8, the Play release, is Kerim's). Kept as the record of the shape and the decisions; the operative summary is the "Planner notes" section in `AGENTS.md`. Source of truth for the feature's shape is the native iOS app (`~/programming/ios-native/plateful`, branch `feat/planner-notes-ui-prototype`) and the server contract in that repo's `docs/knowledge/planner-notes.md`. Product truth: `~/PersonalOS/business/products/plateful.md`.

## Why

A household blocks days it won't cook ("Draußen essen", "Geburtstag") by planning fake recipes. iOS now has real notes: a note is text shared across its copies, placed on days or in the pool like a recipe, dragged, edited, removed. The server side shipped on 2026-09-07 and is live in production. This app already receives note rows: it renders them as a "-" row with an empty recipe id on the planner and on Home. That is the gap to close.

## Scope

Parity with iOS, one codebase for web and Android:

- Notes render on their day and in the no-date drawer (pool), and on Home under "Planned for today".
- A note is created from a day: the day's "+" offers Recipe (today's cookbook path) or Note; the note dialog has one text field, suggestion chips, and Add.
- Drag and drop, move to no date, remove: same as recipes, same code.
- Edit note: tapping a note (planner row, Home card) or its menu opens the same dialog with Save; the text changes on every copy.
- Edit plan for a note: the weekly dialog plans it onto several days and pool copies, like a recipe.
- No cooked state, no rating, no mission count for notes. Past notes are dimmed, nothing else.

Out of scope: pool "+" for notes (a note gets into the pool by drag or by Edit plan), notifications (the server reminders already join `recipes`, so notes never count as a dish; the weekly reminder counts note days on purpose), analytics events (this app has none for planning today, neither does iOS).

## Server: nothing to add

Everything exists, applied 2026-09-07 (`supabase/migrations/20260907184548_planner_notes_persistence.sql` in the iOS repo):

- `planner_notes(id, household_id, text, owner_id, created_at, updated_at)`, household-scoped RLS, in the realtime publication.
- `meal_planning` gained `note_id` (composite FK with `household_id`) and `updated_at`; `eaten` is nullable; the check constraint says a row is either a recipe (`recipe_id`, `eaten` true/false) or a note (`note_id`, `eaten` NULL). `household_id` is NOT NULL. Policies are household-scoped now.
- RPC `create_planner_note(p_household_id, p_note_id, p_entry_id, p_text, p_planned_date date default null)`: creates text and first placement atomically, idempotent on retry with the same ids.
- RPC `apply_planner_changes(p_household_id, p_insertions jsonb, p_delete_ids uuid[], p_recipe_id default null, p_note_id default null)`: one transaction for the weekly dialog's delta, for recipes AND notes; `p_insertions` is `[{ "id": uuid, "planned_date": "2026-09-13" | null }]`; only the given ids are deleted.
- Deleting the last placement deletes the note row (deferred constraint trigger). Plain `PATCH`/`DELETE` on `meal_planning` work for note placements, so `updateDate` and `delete` need no change.

First task in the repo: `npm run generate-supabase-types` (falls back to the Supabase MCP `generate_typescript_types` if the CLI has no login) so `database.types.ts` carries `meal_planning.note_id`, `eaten: boolean | null`, `planner_notes`, and both RPCs under `Functions`.

Date rule for everything new: send `planned_date` as a local `yyyy-MM-dd` string (`format(date, "yyyy-MM-dd")` from date-fns), never `toISOString()`. The existing recipe path sends ISO timestamps, which Postgres casts in UTC; that is off by one day between local midnight and 02:00. Fix it for recipes in the same sweep (`useUpdatePlannedItemDate`, `useSaveRecipePlans`), it is a one-line change each.

## 1. Data layer

`src/types/meal-planning.types.ts`

```ts
export type PlannedRecipe = {
  kind: "recipe";
  id: string; // meal_planning.id, the placement
  recipeId: string;
  recipeName: string;
  planned_date: Date | null;
  eaten: boolean;
};
export type PlannedNote = {
  kind: "note";
  id: string; // the placement
  noteId: string; // planner_notes.id, shared by every copy
  text: string;
  planned_date: Date | null;
};
export type MealPlannerItem = PlannedRecipe | PlannedNote;

export type MealPlannerItemRaw = {
  id: string;
  planned_date: string | null;
  eaten: boolean | null;
  recipes: { id: string; name: string } | null;
  planner_notes: { id: string; text: string } | null;
};
```

`PlannedItemSummaryRaw` gains `planner_notes: { text: string } | null`; `PlannedItemSummary` becomes `{ planned_date, label, kind }` so the weekly dialog can show note chips.

`src/lib/transformers/meal-planning.transformer.ts`: a row with `planner_notes` becomes a note, a row with `recipes` a recipe, a row with neither is dropped (today it becomes the "-" row). Parse `planned_date` with `parseISO` (local midnight) instead of `new Date(...)` (UTC midnight, the previous evening west of Greenwich).

`src/api/meal-planning.api.ts`

- `getItemsForWeek`: select `id, planned_date, eaten, recipes(id, name), planner_notes(id, text)`.
- `getSummaryForWeek`: select `planned_date, recipes(name), planner_notes(text)`.
- new `createNote({ householdId, noteId, entryId, text, plannedDate })` → `supabase.rpc("create_planner_note", { p_household_id, p_note_id, p_entry_id, p_text, p_planned_date })`.
- new `updateNoteText(noteId, text)` → `from("planner_notes").update({ text }).eq("id", noteId).select("id").maybeSingle()`; no row back means a partner removed the note meanwhile: throw, never recreate.
- new `applyPlannerChanges({ householdId, insertions, deleteIds, recipeId?, noteId? })` → `supabase.rpc("apply_planner_changes", ...)`.
- `getPlansForRecipeInWeek` → `getPlacementsInWeek(subject, weekStart, weekEnd)` filtering on `recipe_id` or `note_id`.

`src/hooks/meal-planning/`

- `useCreateNote()`: mints `noteId` and `entryId` with `crypto.randomUUID()` when the mutation is called (a retry of the same variables reuses them, the RPC is idempotent), invalidates `queryKeys.mealPlanning.all` on settle.
- `useUpdateNoteText()`: optimistic like `useSetEaten`: patch every cached item with that `noteId`, roll back on error, invalidate on settle.
- `useApplyPlannerChanges()`: replaces `useSaveRecipePlans`; the weekly dialog for both kinds saves through it (see 4).
- `useRecipePlansForWeek` → `usePlacementsForWeek(subject, week, enabled)`.
- `useMealPlannerItems`, `useDeletePlannedItem`, `useUpdatePlannedItemDate`, `useSetEaten`: unchanged. Nothing may call `setEaten` for a note.

## 2. Planner page

`src/components/mealPlanner/mealPlannerItem/MealPlannerItem.tsx`: takes `item: MealPlannerItem` instead of spread recipe props. Same card, same drag handle and touch handlers, same `useDraggable`. For a note: a `StickyNote` tile (lucide) on `bg-muted` where the cover is, the text as the title (`line-clamp-2`), no check button, tap opens the note dialog instead of navigating. Menu drawer: Edit plan, Edit note, Move to no date (dated rows only), Remove (keep the confirm dialog). If the branching stays small keep one component; otherwise split into `PlannedRecipeItem` and `PlannedNoteItem` around a shared shell.

`src/page/MealPlanner.tsx`

- State: `entryChooserDay: Date | null` and `noteDialog: { mode: "create"; day: Date | null } | { mode: "edit"; note: PlannedNote } | null`; `editingRecipe` becomes `editingSubject: PlanSubject | null`.
- `notPlannedItems`: `planned_date === null && (item.kind === "note" || !item.eaten)`. `handleRecipeEaten` only for `kind === "recipe"`.
- Empty day: `MealPlannerAdd` opens the chooser for that day instead of navigating straight to `/cookbook`. New `PlannerEntryChooser` (ui `Drawer`): title "Add to plan" with the weekday, two rows: Recipe → `navigate("/cookbook")` (today's path, the day is not carried, same as now), Note → note dialog for that day.
- Days with items: a ghost "+" at the right of the day label opens the same chooser (iOS has it; without it a note cannot join a day that already holds a recipe, the most common case: "Reste" next to a dish).
- Past notes: `opacity-60` when `planned_date` is before today, presentation only.
- `DragOverlay`: note tile plus text for notes.
- Drawer auto-open effect counts notes too (it already reads `notPlannedItems.length`).

New `src/components/mealPlanner/noteDialog/NoteDialog.tsx` (ui `Dialog` + `Textarea`): header "Note" / "Edit note", placement line (weekday or "No date"), one field (2 to 4 rows, trimmed on save, Add/Save disabled while blank), suggestion chips that fill the field (Eating out, Birthday, Leftovers, At family's), primary button. On failure: `toast.error` plus `reportError`, dialog stays open with the draft. Create calls `useCreateNote`, edit calls `useUpdateNoteText`.

## 3. Home

`src/page/Home.tsx`: `todaysItems` filters by date only, recipes then notes (the planner's order). A note alone counts as planned, so "Nothing planned for today" stays away. New `src/components/home/TodaysNoteCard.tsx`: the recipe card's frame with the note tile and text, no "Cooked it", tap opens `NoteDialog` in edit mode.

## 4. Edit plan for notes

`src/components/general/WeeklyPlanDialog.tsx` takes `subject: PlanSubject` where

```ts
type PlanSubject =
  | { kind: "recipe"; id: string; name: string }
  | { kind: "note"; noteId: string; text: string };
```

Both call sites change (`Recipe.tsx`, `MealPlanner.tsx`). Inside:

- Planned days come from the subject's own placements (`usePlacementsForWeek`), not from matching the summary by recipe name. That also fixes two recipes with the same name reading as each other.
- The summary chips per day show note texts too.
- Save goes through `apply_planner_changes`: insertions `{ id: crypto.randomUUID(), planned_date }` for added days plus `withoutDateCount` null copies, `deleteIds` for deselected days. One transaction instead of today's `Promise.all` of inserts and deletes, so a half-failed save can no longer leave the plan with more rows than asked. Recipes keep the `plan_meals` mission increment; notes don't count.
- `useSaveRecipePlans` and `getPlansForRecipeInWeek` go away with it (no dead code).

This is the one step that changes the recipe flow's persistence path. It is a strict improvement and the RPC is in production and covered by the SQL test, but test the recipe dialog end to end after it.

## 5. Follow-ups in the same sweep

- `src/App.tsx` daily reminder tap handler: add `.not("recipe_id", "is", null)` so a note on today doesn't turn the single-recipe deep link into a plain Home navigation.
- Realtime for the plan (optional, last): in the existing `recipes-changes` effect subscribe to `meal_planning` and `planner_notes` and invalidate `queryKeys.mealPlanning.all` through the same coalescing timer. No column filter: DELETE events carry only the primary key and would never pass a `household_id` filter (RLS still scopes inserts and updates to the household; a stranger's delete costs one no-op refetch). Keep the 30 s polling until the subscription is verified on an Android device, then lengthen it.

## 6. Strings (`src/locales/translation.{en,de}.json`)

Same wording as the iOS String Catalog.

| Key                                     | en                 | de                                    |
| --------------------------------------- | ------------------ | ------------------------------------- |
| `mealPlanner.addToPlan`                 | Add to plan        | Zum Plan hinzufügen                   |
| `mealPlanner.addRecipe`                 | Recipe             | Rezept                                |
| `mealPlanner.addNote`                   | Note               | Notiz                                 |
| `mealPlanner.addToDay` (aria)           | Add to this day    | Zu diesem Tag hinzufügen              |
| `mealPlanner.note.title`                | Note               | Notiz                                 |
| `mealPlanner.note.editTitle`            | Edit note          | Notiz bearbeiten                      |
| `mealPlanner.note.placeholder`          | e.g. Eating out    | z. B. Draußen essen                   |
| `mealPlanner.note.suggestions`          | Suggestions        | Vorschläge                            |
| `mealPlanner.note.suggestion.eatingOut` | Eating out         | Draußen essen                         |
| `mealPlanner.note.suggestion.birthday`  | Birthday           | Geburtstag                            |
| `mealPlanner.note.suggestion.leftovers` | Leftovers          | Reste                                 |
| `mealPlanner.note.suggestion.atFamilys` | At family's        | Bei Familie                           |
| `mealPlanner.note.add`                  | Add                | Hinzufügen                            |
| `mealPlanner.note.saveError`            | Couldn't save note | Notiz konnte nicht gespeichert werden |
| `mealPlanner.planUpdated`               | Plan updated       | Plan aktualisiert                     |
| `mealPlannerItem.editNote`              | Edit note          | Notiz bearbeiten                      |

`common.save`, `mealPlanner.noDate`, `mealPlannerItem.editPlan`, `mealPlannerItem.moveToNoDate`, `mealPlannerItem.remove` are reused.

## 7. Tests

- Vitest: `meal-planning.transformer.test.ts` (recipe row, note row with `eaten: null`, orphan row dropped, local date parsing); `dateHelper` local date formatter; `mealPlanHelper` stays as is.
- Storybook: `MealPlannerItem` note variant, `TodaysNoteCard`, `NoteDialog`.
- Playwright: `MockMealPlan` gets `note_id`, `eaten: boolean | null`, `planner_notes`; factory `createNotePlan({ text, planned_date })`; mocks for `**/rest/v1/rpc/create_planner_note`, `**/rest/v1/rpc/apply_planner_changes` (204) and `PATCH **/rest/v1/planner_notes?*`; specs: note visible on its day and on Home, chooser → note dialog → Add calls the RPC. The suite is red repo-wide (auth fixture, see the iOS repo's `docs/knowledge/android-stays-ios-is-priority.md`), so these are written to be ready, and the gate stays `npm run lint && npm run test:run`.

## 8. Release

- Web: push to `main`, Vercel deploys `app.plateful.cloud`.
- Android: `npx cap sync android`, `versionCode 38` / `versionName "0.0.38"` in `android/app/build.gradle`, release AAB, Play Console. The regenerated splash PNGs from 2026-08-27 ride along.
- Sequencing with iOS: a Capacitor build never breaks on note rows (before this plan it shows "-", after it shows notes), so this release is safe on its own. The constraint runs the other way: as soon as ANY client creates notes, an iOS 1.0 install in the same household shows an empty plan (it cannot decode `eaten: null`). Note creation, on iOS and here, therefore waits for `app_config.min_supported_version` to be raised per the iOS repo's `docs/app-update-gate.md`. If Capacitor should go earlier anyway, ship steps 1 to 3 without the chooser (display, drag, remove, edit text) first; that is harmless at any time.

## Order of work

Each step builds and passes `npm run lint && npm run test:run` on its own; commit per step.

1. Types, API, transformer, hooks, unit tests (S). Regenerate database types first.
2. Render notes: planner rows, pool cards, overlay, dimming, Home card (M). The "-" rows are gone after this.
3. Create: chooser drawer, note dialog, header "+", `useCreateNote` (M).
4. Edit text and menu wiring on planner and Home (S).
5. Weekly dialog on `PlanSubject` and the RPC, delete the old save hook (M).
6. Reminder handler, realtime (S).
7. Strings complete in both languages, stories, e2e factories and specs (S).
8. Version bump, cap sync, Play upload, web push (S), timed with the iOS gate.

Sizes: S under half a day, M about a day. Two to three focused sessions in total.

## Decisions to confirm

1. Route the recipe "Edit plan" through `apply_planner_changes` too (recommended: yes, one path, atomic).
2. Add the "+" on days that already hold items (recommended: yes, parity with iOS and the only way to put "Reste" next to a dish).
3. Realtime for the plan with polling kept as fallback (recommended: yes, do it last).
4. One release after the iOS update gate, or display-only first (recommended: one release).

## Follow-up (2026-09-08): suggestion chips learn from the household

Kerim's idea: the four built-in chips can't guess what a household really plans. Implemented on both platforms the same day. Server: RPC `planner_note_suggestions(p_household_id, p_limit default 6)` in the iOS repo's migrations, the household's note placements grouped by trimmed, case-insensitive text, ordered by count then latest day, returned in the most recently written spelling, texts over 30 characters left out (specifics, not labels). Since a note row lives as long as any placement of it exists, "the plan so far" is the history. Client rule, identical in Swift (`PlannerNoteSuggestionChips.merge`) and TypeScript (`mergeNoteSuggestions`): own texts first, then the built-ins not already among them, six at most. Here: `useNoteSuggestions` under the plan's query keys (every plan mutation's invalidation refreshes it), used by `NoteDialog`; the e2e mock answers the RPC from the scenario's notes. Verified on iOS against production first, then here by unit tests.
