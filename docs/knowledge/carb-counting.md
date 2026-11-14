# Carb counting: stored with fiber, shown the reader's way

_Since 2026-11-14 the app shows `carbs_g - fiber_g` by default outside the US and Canada; `recipes.carbs_g` stays total carbohydrate including fiber, and only the screen converts._

`recipes.carbs_g` is the US label's total carbohydrate, fiber included, for every writer. Labels in the EU and most other countries print carbs without fiber, so readers there see `max(carbs_g - fiber_g, 0)` (unchanged when fiber is null). The choice lives in `localStorage["carbCounting"]` (`withoutFiber` | `withFiber`); without one it follows the browser locale's region (`US`/`CA` count with fiber, everything else and a locale without a region count without). Settings > General > Nährwerte (`/nutritionSettings`) switches it and carries the CC BY 4.0 attribution the BLS data requires.

All of it is `src/lib/carbCounting.ts`: `shownNutrition` for display, `storedNutrition` to turn typed values back. Only two seams call them. `NutritionSection` converts what it is given (the recipe page and the share page both pass stored values), and `NutritionEditor` converts when it seeds its fields and when it reports them up, so `AddRecipe` and every write keep the stored form. The share snapshot copies the stored columns and never converts. A new place that shows carbs goes through `shownNutrition`; a new place that writes them must not.

Contract and the iOS side: `docs/knowledge/nutrition-values.md` in `~/programming/ios-native/plateful` (`CarbCounting` in `Core/NutritionFacts.swift`). Covered by `src/lib/carbCounting.test.ts` (the iOS cases) and `e2e/nutrition.spec.ts` (card, settings switch and the editor's write in German, the card in the US).
