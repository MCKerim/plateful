# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start dev server with hot reload (--host enabled)
npm run build        # TypeScript check + Vite production build
npm run lint         # Run ESLint
npm run test         # Run Vitest tests
npm run test:e2e     # Run Playwright E2E tests (all browsers)
npm run storybook    # Start Storybook on port 6006
```

### Mobile Development (Capacitor)

```bash
npx cap sync         # Sync web assets to native projects
npx cap open ios     # Open iOS project in Xcode
npx cap open android # Open Android project in Android Studio
```

### Code Generation

```bash
npm run generate-supabase-types  # Regenerate TypeScript types from Supabase schema
npm run generate-pwa-assets      # Generate PWA icons from logo
```

## Architecture

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (auth, database, realtime)
- **State**: Redux Toolkit (user/household/chatbot state) + React Query (server state)
- **Mobile**: Capacitor (iOS/Android) + PWA
- **UI**: shadcn/ui components (Radix primitives) + Material UI icons + Lucide icons
- **DnD**: @dnd-kit/core (meal planner zone-based drag) + @dnd-kit/sortable (ingredient list reordering)
- **Subscriptions**: RevenueCat (in-app purchases, paywall)
- **Analytics**: PostHog (`src/hooks/analytics/`)

### Path Alias

Use `@/` to import from `src/` (configured in vite.config.ts and tsconfig.json).

### No Barrel Files

Do not create `index.ts` barrel files for re-exporting. Import directly from source files instead (e.g., `@/hooks/recipe/useRecipe` not `@/hooks/recipe`).

### Key Directory Structure

- `src/page/` - Route page components (MealPlanner, Recipe, Cookbook, Chatbot, etc.)
- `src/components/ui/` - shadcn/ui base components
- `src/components/mealPlanner/` - Meal planner feature components (drag-and-drop enabled)
- `src/api/` - API layer functions (Supabase queries)
- `src/hooks/` - Custom React hooks organized by domain (meal-planning/, recipe/, ratings/, etc.)
- `src/lib/transformers/` - Data transformation functions (raw API → domain types)
- `src/redux/slices/` - Redux slices (user, household, chatbot, filterAndSorting, mealPlanner, servings, subscription)
- `src/providers/` - React context providers (RevenueCat)
- `src/lib/query-keys.ts` - React Query key factory for cache management
- `src/types/database.types.ts` - Auto-generated Supabase types
- `src/types/meal-planning.types.ts` - Domain types for meal planning feature
- `src/types/ingredient.types.ts` - Domain types for ingredients
- `src/components/ingredients/` - Ingredient UI components (list, editor, scaler)
- `src/hooks/ingredients/` - Ingredient React Query hooks
- `src/lib/ingredient-parser/` - Ingredient text parsing and scaling utilities
- `src/locales/` - i18n translation files (en, de)

### State Management Pattern

- **Redux**: User session, household data, chatbot state, UI filters, meal planner week navigation, per-recipe serving size overrides (session-only), subscription/paywall state
- **React Query**: Server data (recipes, meal plans, ratings) with 5-minute stale time
- **Supabase Realtime**: Live updates for user/household changes

> When updating DB flags (e.g. `has_completed_survey`), dispatch Redux update locally before navigating — Realtime sync has a delay and the routing guard will redirect if state hasn't updated yet.

### Authentication & Routing

The app uses a multi-step onboarding flow. `routeToCorrectPagePure()` in `src/lib/routeToCorrectPagePure/` controls access based on:

1. Login status
2. Value screens completion
3. Survey completion
4. Household membership

### Supabase Access

Use the `useSupabase()` hook to get the typed Supabase client. Types are generated from the schema in `src/types/database.types.ts`.

### RLS Policy Mental Model

- **Household-scoped**: recipes, recipe_ingredients, cookbooks, meal_planning
- **Owner-scoped** (write): recipe_ratings, survey_answers
- **Intentionally open SELECT**: household, users, invites (needed for invite flow and member lookup)

### Subscription & Paywall

The app has a hard paywall — users must subscribe (monthly or yearly) to use the app. Subscriptions are **household-based**: only one household member needs to pay.

- **RevenueCat** handles purchase management and entitlement checks
- `src/lib/revenuecat.ts` — RevenueCat SDK wrapper
- `src/providers/RevenueCatProvider.tsx` — initializes RevenueCat and syncs state
- `src/redux/slices/subscriptionSlice.ts` — stores `isPro` and loading state
- `src/hooks/subscription/` — hooks: `useSubscription`, `useHouseholdSubscription`, `usePresentPaywall`, `useCustomerCenter`
- `src/api/subscription.api.ts` — Supabase-side subscription data
- Entitlement ID is defined in `src/types/subscription.types.ts`

When adding new features, check `isPro` via `useSubscription()` to gate access behind the paywall.

### Notifications

Push notification permission management is in `src/hooks/notifications/`. Firebase integration for push notifications is planned but not yet implemented.

### Known Issues

`ISSUES.md` at the project root tracks known bugs and improvement areas that are low-priority but worth fixing eventually. Check it when working in affected areas.

### Internationalization

Supports English and German. Use `useTranslation()` hook and add strings to `src/locales/translation.{lang}.json`.

### Data Fetching Pattern

The app uses a layered architecture for data fetching:

1. **API Layer** (`src/api/`): Raw Supabase queries returning database types
2. **Transformers** (`src/lib/transformers/`): Convert raw API data to domain types
3. **Hooks** (`src/hooks/`): React Query hooks that compose API + transformers

Example flow for meal planning:

```
useMealPlannerItems (hook)
  → mealPlanningApi.getItemsForWeek (API)
  → transformMealPlannerItems (transformer)
  → MealPlannerItem[] (domain type)
```

### Ingredients System

Recipes store ingredients as structured data in the `recipe_ingredients` table, using a hybrid approach: raw text is always preserved (user sees what they typed), and parsed fields (`quantity_value`, `unit`, `ingredient_name`) enable scaling and future shopping list aggregation.

**Recipe table columns:** `instructions` (separated from legacy `description`), `base_servings`, `servings_unit`.

Data flow:

```
useRecipeIngredients (hook)
  → ingredientsApi.getByRecipeId (API)
  → transformIngredients (transformer)
  → RecipeIngredient[] (domain type)
```

**Parser** (`src/lib/ingredient-parser/parse-ingredient.ts`): Extracts quantity, unit, and ingredient name from free-form text like `"2 cups flour"`. Handles fractions, ranges, metric/imperial, and German units. If a number is found it will scale; unrecognized text is preserved as-is.

**Scaling** (`src/lib/ingredient-parser/scale-ingredients.ts`): Multiplies `quantity_value` by `targetServings / baseServings`. Uses `formatQuantity()` for smart display (0.5 → "1/2", 1.5 → "1 1/2").

**Sections/Groups**: Ingredients support `group_name` for organizing into sections (e.g. "Sauce", "Dough"). The editor uses a flat list of `EditorItem` (union of ingredient and section header). Section headers are positioned in the list; all ingredients after a header inherit that section name until the next header. `ingredientsToEditorItems()` and `editorItemsToInputs()` handle conversion. Both editors support drag-and-drop reordering via `@dnd-kit/sortable`.

### Instructions System

Instructions are structured step rows in the `recipe_instructions` table (`step_text`, `group_name`, `sort_order` — mirroring `recipe_ingredients`), and the step rows are the source of truth. Every write **dual-writes** a legacy markdown string into `recipes.instructions` (serialization in `src/lib/transformers/instruction.transformer.ts`: continuous numbering + `### Section` headings) so released old app versions keep working. Hooks in `src/hooks/instructions/`; the step editor reuses the ingredient editor with label overrides.

### Recipe Imports (async pipeline)

Importing from a URL or photos is **insert-based** — the same pipeline the native iOS app uses. `src/api/recipeImport.api.ts` inserts a `recipe_imports` row (photos are first uploaded to the private `import-staging` bucket); the backend worker (separate repo: `~/programming/recipe-extractor`, deployed at `https://extractor.plateful.cloud`) extracts in the background and one source can yield **several** recipes. The cookbook shows placeholder cards (`src/components/general/ImportCard.tsx` + `src/hooks/cookbook/useRecipeImports.ts`) that resolve live via Supabase Realtime; retries go through the `retry_import` RPC. The old blocking `recipe-from-url` / `recipe-from-image` edge functions (`supabase/functions/`) exist only for released old builds — never add new callers.

### Nutrition

Seven nullable per-serving columns on `recipes` (`calories_kcal`, `carbs_g`, `protein_g`, `fat_g`, `sugar_g`, `fiber_g`, `sodium_mg`; NULL = not calculated; the card hides when all are null). `src/api/nutrition.api.ts` calls the recipe-extractor's `POST /api/nutrition/estimate` with the user's JWT — the route returns camelCase estimates (mapped to the snake_case columns client-side) and persists nothing; values save through the normal recipe update under RLS. Imports auto-estimate server-side. UI: `NutritionSection` / `NutritionEditor` in `src/components/recipe/`.

### Recipe Images

Recipe covers live in the **public** `recipeimages` bucket at `recipe_<id>/<file>`, referenced by the `recipes.image_path` column; render via the public URL (`getPublicUrl`), no signing or storage listing. Producers set `image_path` explicitly after upload/remove (AddRecipe, the import worker, the legacy edge functions) — it is not derived or trigger-maintained.

## E2E Testing

### Running E2E Tests

```bash
npm run test:e2e                                    # All browsers
npm run test:e2e -- --project=chromium              # Chromium only
npm run test:e2e -- --project=chromium e2e/cookbook.spec.ts  # Single file
```

### Test Architecture

E2E tests use Playwright with custom fixtures for authenticated testing:

```
e2e/
├── fixtures/
│   ├── index.ts              # Extended test with setupAuth fixture
│   ├── types.ts              # Mock data types (MockUser, MockRecipe, etc.)
│   ├── auth.fixture.ts       # Session creation, auth route handlers
│   └── api-mocks.fixture.ts  # REST API route interception
├── factories/
│   ├── index.ts              # Re-exports all factories
│   ├── user.factory.ts       # createUser()
│   ├── recipe.factory.ts     # createRecipe()
│   └── meal-plan.factory.ts  # createMealPlan(), createWeeklyMealPlans()
└── *.spec.ts                 # Test files
```

### Writing Authenticated Tests

Import from `./fixtures` instead of `@playwright/test`:

```typescript
import { test, expect } from "./fixtures";
import { createRecipe } from "./factories";

test("should display recipes", async ({ page, setupAuth }) => {
  const recipe = createRecipe({ id: 1, name: "Test Recipe", category: 2 });
  await setupAuth({ recipes: [recipe] });

  await page.goto("/cookbook");
  await expect(page.getByText("Test Recipe")).toBeVisible();
});
```

### Factory Functions

- `createUser(overrides?)` - Creates mock user with household
- `createRecipe(overrides?)` - Creates mock recipe (use `category: 2` for Main dishes)
- `createMealPlan(overrides?)` - Creates mock meal plan (use `planned_date: null` for unplanned)
- `createWeeklyMealPlans(recipes, householdId)` - Creates 7 days of meal plans

### API Mocking

The `setupAuth` fixture automatically mocks:

- `/auth/v1/**` - Supabase auth endpoints
- `/rest/v1/users` - User data with household join
- `/rest/v1/recipes` - Recipes list and single recipe fetch
- `/rest/v1/meal_planning` - Meal plans
- `/rest/v1/recipe_ratings` - Recipe ratings
- `/rest/v1/recipe_ingredients` - Recipe ingredients
