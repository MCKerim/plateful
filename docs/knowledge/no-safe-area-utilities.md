# There are no `*-safe-*` Tailwind utilities

**Symptom (Todoist, 2026-09-23):** on `/share/:token` the fixed bottom bar ("Log in to save this recipe" + "Get the Plateful app") covered the last instruction steps; the page could not be scrolled far enough to read them.

**Cause:** classes like `pb-safe-4`, `h-safe-b-[100px]` and `top-safe-5` belong to a safe-area Tailwind plugin this repo has never installed (`tailwind.config.js` loads only `tailwindcss-animate`). Tailwind silently emits nothing for an unknown class, so every spacer written as `h-safe-b-[…]` had height 0 and every `pb-safe-4` bar had only its `p-4`. Content behind a fixed footer was hidden on the recipe, edit, URL import and share pages.

**Fix (2026-10-15):** write the inset as an arbitrary value, the form `ImageImport.tsx` already used: `pb-[calc(1rem+env(safe-area-inset-bottom))]` on the bar, `h-[calc(4.625rem+env(safe-area-inset-bottom))]` for a one-row bar's spacer. The share page's bar holds one or two buttons, so no single spacer height fits: it is `sticky bottom-0` in the flow instead, with no spacer. `e2e/shared-recipe.spec.ts` checks that the last step ends above the bar.

**Still open:** `Cookbook.tsx` uses `top-safe-5` on its search bar, so `sticky` there has no `top` and never sticks. Fixing it changes behaviour (the bar would start sticking), so it was left for a deliberate decision.

**Note:** `index.html` has no `viewport-fit=cover`, so `env(safe-area-inset-bottom)` is 0 in iOS Safari. Capacitor 8's `SystemBars` writes Android insets into `--safe-area-inset-*` CSS variables, not into `env()`; what `env()` returns in the Android WebView without `viewport-fit=cover` was not checked on a device.
