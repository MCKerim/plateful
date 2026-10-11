# Shopping list on Capacitor (web + Android)

Plan, 2026-10-11. Status: in progress. Parity port of the iOS shopping
list (iOS 1.2 and 1.3, built 2026-09-14 to 10-08). The iOS repo is the
spec; this file names what is copied, what is adapted, and the order.

## Why

The household's weekly list replaces Bring. iOS has it since 1.2; Celine
uses Android and has none. The blog already promises the list and the
week-to-list flow without a platform caveat (PersonalOS decision
2026-09-29). Android 1.3 shipped without it on 2026-10-09.

## The spec lives in the iOS repo

Read, in this order, before touching code:

1. `~/programming/ios-native/plateful/docs/knowledge/shopping-list.md`
   (every mechanism and every decision, with dates)
2. `~/programming/ios-native/plateful/docs/shopping-list-plan.md`
   (model, behaviour, schema, what is deliberately later)
3. `~/programming/ios-native/plateful/plateful/Features/ShoppingList/*.swift`
   (4,400 lines; the logic to port is in `ShoppingListStore.swift`,
   `ShoppingListItem.swift`, `ShoppingItemSource.swift`,
   `ShoppingPlanAdd.swift`, `ShoppingEmoji.swift`)
4. `~/programming/ios-native/plateful/platefulTests/Shopping*.swift`
   (1,100 lines of cases; port them as Vitest cases)

Product truth: `~/PersonalOS/business/products/plateful.md`, section
"Einkaufsliste".

## Server: nothing to add

Everything is in production and platform-neutral (migrations
`20260914130000` to `20261008100000` in the iOS repo). Types regenerated
here on 2026-10-11 (`npm run generate-supabase-types`).

Table `shopping_list_items` (one row per product per household; `on_list`
flips, buying stamps `bought_at` / `bought_count`, keeps the amount, empties
`sources`): `id, household_id, name, quantity_value, quantity_display,
unit, ingredient_slug, category, sources, created_by, created_at,
updated_at, on_list, added_at, bought_at, bought_count`. Unique per
household on `name_key` (generated, lowercased name) and on
`ingredient_slug`. Realtime publication, replica identity full, so deletes
carry the row.

RPCs (all `security invoker`, household-scoped by RLS):

| RPC | Use |
|---|---|
| `add_shopping_list_item(p_id, p_household_id, p_name, p_quantity_value, p_quantity_display, p_unit)` | a typed line; client-minted id, retry-safe; server matches the name to the dictionary and returns the row with slug and aisle |
| `add_ingredients_to_shopping_list(p_household_id, p_lines jsonb)` | recipe lines `[{ingredient_id, scale}]`; recipe sheet and week sheet both use this one (`add_recipe_to_shopping_list` is the 1.2 legacy, do not call it) |
| `remove_recipe_from_shopping_list(p_household_id, p_recipe_id)` | takes a recipe off: replays the ledger, returns touched rows |
| `update_shopping_list_item(p_id, p_name, p_category, p_quantity_value, p_quantity_display, p_unit)` | the edit sheet; amount params only when the amount changed |
| plain `update on_list` | tick (buy) and put-back; the trigger does the rest |
| plain `delete` | "Remove" for good |

## Scope (parity with iOS 1.3)

- **Tab "Liste" / "List"** (the native `Tab("List")`), fifth in `BottomNav` after Plan, route
  `/shopping`. (Kerim's call 2026-10-11: five tabs, Chatbot stays.)
- **List screen**: header sentence ("**12 Sachen** zu kaufen, [cover fan]
  **2 Rezepte** dabei"), open items grouped by aisle in the iOS store-walk
  order (`ShoppingAisle` order in `ShoppingListItem.swift`), item cards
  (emoji, name, amount, info button), tap ticks with optimistic flip,
  "Zuletzt gekauft" tiles (last 20 off the list, tap puts back with the
  kept amount), empty state with the mascot PNGs (copy
  `MascotShopping.png` / `MascotShoppingDone.png` from the iOS asset
  catalog), pinned Add button.
- **Add sheet**: one text field, the line parsed with
  `src/lib/ingredient-parser` (same parity contract as iOS
  `IngredientParser`), fuzzy suggestions (port `Fuzzy.score` with its
  thresholds), every row drawn as the list's own card showing exactly what
  a tap puts on the list (port `ShoppingPreview`), a bought item with an
  amount shown twice (plain, then with its last amount), Return adds the
  typed line and keeps the sheet open, a bare name already on the list only
  flashes it.
- **Item detail sheet**: where the amount comes from (ledger entries:
  recipe with cover, by hand, who and when), Edit, Remove. **Edit sheet**:
  name, amount, aisle picker; amount sent only when the text differs from
  the prefill.
- **Recipe sheet** (from the header's "N Rezepte"): the recipe's items with
  its share, cover and name open the recipe, "Von der Liste entfernen".
  One recipe opens its sheet directly, several open a recipe list first.
- **Recipe → list** on the recipe page next to `IngredientList`: checklist
  of the recipe's lines, staples (`ingredients.is_staple`) deselected,
  scale from the serving scaler, preview rows, Add.
- **Week → list** in the planner's bar: the shown week's uncooked meals
  from today plus the pool, one row per recipe ("2×"), a serving count per
  meal (sheet-only state), recipes already on the list deselected, merged
  ingredient checklist with summed, rounded amounts (port
  `ShoppingPlanAdd.meals` and `roundScaled`). Port `ShoppingPlanAddTests`.
- **Realtime**: one more `postgres_changes` subscription in `App.tsx` on
  `shopping_list_items` that invalidates `queryKeys.shoppingList.all`.
- **Strings** DE and EN in `src/locales`, same wording as the iOS string
  catalog. **Analytics**: `shopping_list_items_added {source: recipe |
  plan | manual, count}` through `src/lib/analyticsEvents.ts`; `platform`
  comes from the super property.
- **Release**: `versionName` 1.4, `versionCode` 43, Settings "About"
  string `v1.4`, in the last commit. The Play upload is Kerim's.

## Copied 1:1 (logic with Swift tests)

`ShoppingListItem.addTypedAmount`, `amountText` (the decimal-separator
rule), `ShoppingPreview.item`, `ShoppingSuggestion.item(amountFrom:)`,
`TypedLine.parse`, `Fuzzy.score`, `ShoppingItemSource` decoding (entries
without `kind` read as recipe), `ShoppingPlanAdd.meals` and `roundScaled`,
`ShoppingEmoji`. Each lands in `src/lib/shopping-list/` as pure TypeScript
with the Swift test cases as Vitest cases.

## Adapted, not copied

- Liquid Glass, haptics, the 42 % header offset. The screen uses the
  app's shadcn + Tailwind components; the header sentence and the aisle
  grouping stay. Check thumb reach on the Android emulator and adjust the
  top padding if the first row sits above the middle.
- `ReloadGate`: React Query's invalidation plus optimistic mutations cover
  it. Write failures roll back the optimistic update and refetch.
- Sheets: shadcn `Drawer` / `Dialog` as the planner's note dialog does.

## Data shape

`ShoppingListItem` is the row as the database returns it
(`Database["public"]["Tables"]["shopping_list_items"]["Row"]`), parsed once
at the boundary into a typed model with `aisle: ShoppingAisle` (closed
union, unknown category reads as `other`) and `sources: ShoppingItemSource[]`
(discriminated by `kind`). The store is a React Query cache keyed by
household; mutations are optimistic. Aisle order and aisle labels are one
table, not branches.

## Build sequence

1. Plan doc (this file), types regenerated. Commit.
2. `src/lib/shopping-list/` pure logic with Vitest cases ported from the
   Swift tests. Commit.
3. API (`src/api/shopping-list.api.ts`), hooks
   (`src/hooks/shopping-list/`), query keys, realtime subscription.
4. Route, tab, list screen on fixtures, then on the hooks. Add sheet,
   detail, edit, remove, recipe sheet. Verify on `npm run dev` with
   Kerim's household and on the Android emulator against iOS side by side.
5. Recipe → list, week → list. Verify both against iOS on the same
   household (the merge is the server's, so rows must match exactly).
6. Strings, analytics, version bump, release commit.
