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

### Path Alias
Use `@/` to import from `src/` (configured in vite.config.ts and tsconfig.json).

### Key Directory Structure
- `src/page/` - Route page components (MealPlanner, Recipe, Cookbook, Chatbot, etc.)
- `src/components/ui/` - shadcn/ui base components
- `src/components/mealPlanner/` - Meal planner feature components (drag-and-drop enabled)
- `src/api/` - API layer functions (Supabase queries)
- `src/hooks/` - Custom React hooks organized by domain (meal-planning/, recipe/, ratings/, etc.)
- `src/lib/transformers/` - Data transformation functions (raw API → domain types)
- `src/redux/slices/` - Redux slices (user, household, chatbot, filterAndSorting)
- `src/lib/query-keys.ts` - React Query key factory for cache management
- `src/types/database.types.ts` - Auto-generated Supabase types
- `src/types/meal-planning.types.ts` - Domain types for meal planning feature
- `src/locales/` - i18n translation files (en, de)

### State Management Pattern
- **Redux**: User session, household data, chatbot state, UI filters
- **React Query**: Server data (recipes, meal plans, ratings) with 5-minute stale time
- **Supabase Realtime**: Live updates for user/household changes

### Authentication & Routing
The app uses a multi-step onboarding flow. `routeToCorrectPagePure()` in `src/lib/routeToCorrectPagePure.tsx` controls access based on:
1. Login status
2. Value screens completion
3. Survey completion
4. Household membership

### Supabase Access
Use the `useSupabase()` hook to get the typed Supabase client. Types are generated from the schema in `src/types/database.types.ts`.

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
