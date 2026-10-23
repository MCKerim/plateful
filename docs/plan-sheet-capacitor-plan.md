# The Plan sheet on Capacitor (web + Android)

Plan, 2026-10-23. Status: decisions taken (Kerim, 2026-10-23: "ja zu allem"), in build. Parity port of the iOS Plan
sheet (`PlanRecipeSheet` / `PlanEntrySheet`, built 2026-09-02 and extended
with notes and meal types since). It replaces `WeeklyPlanDialog`, the
centred dialog the recipe page and the planner's "Edit plan" open today.
Kerim, 2026-10-23: "Können wir den Plan Dialog so gestalten wie bei iOS? …
der ist viel schöner und besser".

## Why

The dialog is a stack of outline buttons, one per weekday, with the day's
meals as grey name chips, a "Ohne Datum" toggle with a 1–10 day counter,
and a "Speichern" button that never says what it will do. On Celine's
Galaxy it was taller than the screen (fixed in `a27c5c8` by letting every
dialog scroll, not by making it good). iOS solved the same job in
September with a sheet that shows each day as the planner shows it (covers,
names, cooked dimming), marks what saving will add and remove, and names
the save ("Für 2 Tage planen"). The two apps should not disagree on how a
recipe gets onto the plan.

## The spec lives in the iOS repo

Read, in this order, before touching code:

1. `~/programming/ios-native/plateful/docs/planner-plan-from-detail.md`
   (every design decision with Kerim's quotes and dates)
2. `~/programming/ios-native/plateful/plateful/Features/Planner/PlanRecipeSheet.swift`
   (630 lines: layout, sections, rows, pool counter, save)
3. `~/programming/ios-native/plateful/plateful/Features/Planner/PlanChanges.swift`
   (182 lines, the edits model) and `platefulTests/PlanChangesTests.swift`
   (7 cases; port them as Vitest cases)
4. `~/programming/ios-native/plateful/plateful/Features/Planner/PlannerWeek.swift`
   (week switcher, day label, check glyph)

A rendered preview (German, iPhone 18 Pro) is the Xcode preview "Planned
today, pool empty" in `PlanRecipeSheet.swift`.

## Server: nothing to add

`apply_planner_changes` already takes the whole delta (insertions with
client ids, `planned_date` or null, `meal_type`, plus delete ids) in one
transaction, which is stronger than iOS's insert-then-delete batches. The
only change is client-side: the planner's week query also selects
`recipes(image_path)`.

## Scope (parity with iOS)

One full-height bottom sheet (vaul `Drawer`, the house pattern of
`ShoppingPlanAddSheet`), for a recipe or a note, opened from the same three
places as today: the recipe page's Plan button, its menu, its plan-status
line, and the planner row's "Edit plan".

- **No title, no recipe name, no X.** The sheet opens from the recipe's own
  Plan button (Kerim on iOS, 2026-09-02). It closes by swiping down, a tap
  on the overlay, or Android's back button (`useBackButton` sends Escape,
  which vaul honours).
- **Pinned top bar = the week switcher.** Round chevron buttons left and
  right, the rolling title in the middle ("Diese Woche", "Nächste Woche",
  "Letzte Woche", else "19.10. – 25.10."). A tap on the title goes back to
  this week. A horizontal swipe over the days changes the week, and the
  arriving week slides in from the travel direction (the planner's
  `animate-slide-left/right`). The bar gets its band and hairline only once
  rows scroll under it.
- **Meal type picker** under the bar, recipes only (`MealTypePicker`,
  unchanged, preselected as today).
- **Pool section** above the days, outside the week slide. Header "Pool"
  with a quiet "3 Einträge" (uneaten pool entries of every recipe and
  note) and a check circle. The card shows only this recipe: its row plus a
  "− 2 Tage +" capsule while it is in the pool, else the empty card with a
  faint plus.
- **Seven day sections.** Header: bold short weekday, grey date ("Mo
  19.10."), a "Heute" capsule, past days at 55 percent. Then a card listing
  every meal and note on that day: 52 px cover, name, cooked meals and past
  notes at 60 percent, dividers between rows. An empty day is the 76 px
  card with the faint plus, past days included.
- **A tap anywhere on a section toggles it.** Four states, from the plan
  and the edits together:

  | State | Check | Card |
  |---|---|---|
  | not on the plan | empty circle | plain |
  | newly chosen | filled accent | accent wash and 2 px accent ring, the recipe as the last row |
  | on the plan, untouched | filled accent | plain |
  | on the plan, deselected | empty circle | 2 px red ring, this recipe's rows struck through at 50 percent |

- **Pinned bottom save capsule**, disabled until something changed, named
  after what it does: "Für 1 Tag planen" / "Für N Tage planen" (only days
  added), "In den Pool" (only the pool, from empty), "Plan aktualisieren"
  (anything that removes, or a mix). A failure keeps the sheet and its
  choices, so a retry is one tap and lands on the same rows.

Kept from Capacitor because iOS has no equivalent: the success toast, the
`plan_meals` mission increment, `planner_meal_type_set` tracking.

## Copied 1:1 (logic with Swift tests)

- `PlanChanges` → `src/lib/mealPlanHelper/planChanges.ts`, pure and
  immutable like `src/lib/shopping-list/list.ts`: `addedDays`,
  `removedDays`, `poolCount | null`; `dayState`, `toggleDay`, `poolState`,
  `togglePool`, `setPoolCount` (clamped 1…7), `diff`, `saveAction`. Days
  are keyed by the local `yyyy-MM-dd` string (`toPlannedDateString`),
  never `toISOString()`.
- The 7 Swift cases → `planChanges.test.ts`, including the two that matter
  most: a row arriving after open reads as kept, not removed; a retry
  after a half-applied save inserts and deletes only the rest.

This replaces the dialog's `selectedDates` + `initializedWeeks` +
`planIdsByWeek` trio, which copies a selection at open and is the shape
iOS rejected: a plan that loads late or changes under the sheet flips
existing entries to "will be removed".

## Adapted, not copied

- **Data.** One query per shown week, `useMealPlannerItems(week)`: pool and
  week rows with id, recipe, note, `eaten` and `meal_type`, on the
  planner page's own cache key, so opening the sheet from the planner costs
  nothing. It replaces both `usePlannedItemsSummary` (names only, no pool)
  and `usePlacementsForWeek` (no pool copies, which is why the dialog can't
  show or remove them today). The subject's placements are the rows with
  its `recipeId` or `noteId`, across every week visited in this opening
  (`useQueries` over the visited weeks, all cached), deduped by id.
- **Covers.** `getItemsForWeek` selects `recipes (id, name, tags,
  image_path)`, the transformer maps it through `recipeImageUrl`. No
  per-row request: the planner's `MealPlannerItem` fetches its cover one
  query per row (`useRecipeFirstImage`), and a sheet with 14 rows doing the
  same is the fan-out behind the October connection-limit incident
  (`docs/knowledge/supabase-connection-limit.md`).
- **Retry ids.** iOS keeps the request while the diff is unchanged; this
  keeps the existing `insertionIds` signature trick on the diff.
- **Errors.** A toast (`mealPlanner.planUpdateFailed` / `recipe.planningFailed`)
  instead of iOS's alert, as everywhere in this app.
- **Gestures.** `useSwipe` on the days region (75 px, horizontal only). The
  section toggle is an `onClick` on a `button` (one per section, with
  `aria-pressed` and the long date as its name), which a moved touch does
  not fire. Check this on the device, because on iOS a pan that ended on
  a card did fire a Button.
- **Week title.** One pure `weekTitle(week, firstWeekday, t)` in
  `dateHelper.ts`, used by the sheet and the planner page, replacing the
  nested ternary both files carry today.
- **Check glyph.** `ShoppingCheckMark` moves to
  `src/components/general/CheckMark.tsx` and serves both.

## Data shape

```ts
// src/lib/mealPlanHelper/planChanges.ts
type DayKey = string; // "2026-10-23", local
type PlanChanges = { addedDays: Set<DayKey>; removedDays: Set<DayKey>; poolCount: number | null };
type Placement = { id: string; day: DayKey | null; eaten: boolean };
type SectionState = "off" | "added" | "kept" | "removed";
type Diff = { insertTargets: (DayKey | null)[]; deleteIds: string[] };
type SaveAction = { kind: "none" } | { kind: "planDays"; days: number } | { kind: "addToPool" } | { kind: "update" };
```

The sheet holds `PlanChanges`, the picked meal type, the shown week and the
set of visited weeks. Every section state is derived on render.

## Strings (de / en, from the iOS catalog)

New: `plan.pool` "Pool", `plan.entries_one/_other` "{{count}} Eintrag /
Einträge", `plan.planDays_one/_other` "Für {{count}} Tag / Tage planen",
`plan.addToPool` "In den Pool", `plan.update` "Plan aktualisieren",
`plan.fewerDays` / `plan.moreDays` for the counter's labels. Reused:
`mealPlanner.thisWeek/nextWeek/lastWeek`, `common.today`,
`dayWithCount_one/_other`. Deleted with the dialog:
`mealPlanner.goToCurrentWeek`, `mealPlanner.selectDayOrWithoutDate`, and the unused
`alreadyPlanned` / `willBeRemoved`.

## Build sequence

Each step ends green (`tsc`, Vitest, Chromium E2E) and is its own commit.

1. **Model.** `planChanges.ts` plus the 7 ported cases. Nothing imports it
   yet.
2. **Covers in the week query.** `image_path` in `getItemsForWeek`, the raw
   type, the transformer and the E2E factory. The planner's rows can then
   drop `useRecipeFirstImage` (optional, same commit or the next): one
   request fewer per planned row.
3. **Shared pieces.** `weekTitle()` with tests, `CheckMark` moved, the
   planner page switched to `weekTitle()`.
4. **The sheet.** `src/components/general/PlanSheet.tsx` (vaul, pinned
   switcher and save, pool, seven days, states), callers switched (no
   `navigateOnSuccess`),
   `WeeklyPlanDialog.tsx` deleted with its unused paths (`onSaveComplete`,
   the default trigger, uncontrolled mode, `usePlannedItemsSummary` and
   `usePlacementsForWeek` if nothing else uses them).
5. **E2E.** `meal-planner.spec.ts` (the "No Date" dialog, the /today/
   day button, "Save") and `recipe-detail.spec.ts` (the 360×640 fit and the
   "Close" button) move to the new names. New cases: the save label for
   days, pool and update; a deselected day posts its row ids in
   `deleteIds`; a pool copy count of 2 posts two `planned_date: null`
   insertions.
6. **Device check.** The Pixel 10 emulator at 360 dp in German, normal and
   130 percent font, next to the iOS preview: open, swipe two weeks, choose
   a day, deselect a planned one, pool to 2, save, Android back closes.

One owner for all six, in order: step 4 needs 1 to 3, and every step
touches the same planner files, so parallel workers would only collide.

## Decisions (Kerim, 2026-10-23: "ja zu allem")

1. **After saving from the recipe page the user stays on the recipe**, as
   on iOS, with the success toast. `navigateOnSuccess` goes away. The
   plan-status line under the title confirms the result.
2. **"Pool" everywhere.** `mealPlanner.noDate` becomes "Pool" / "Pool", so
   the planner's tray and the sheet say the same; the onboarding already
   speaks of the "Wochenpool".
3. **Pool copies 1…7**, the iOS rule (the old stepper allowed 10 and was
   used as a stepper once in 345 rows).
4. **The planner page's week title** goes back to this week on a tap, like
   the sheet's, and loses the "zur aktuellen Woche" link (step 3).

## Not in this plan

Drag and drop inside the sheet, blocked days, a multi-week list, iOS's
"edge effect" on the bar under iOS 26 (Capacitor gets a plain band and
hairline), and anything on the server.
