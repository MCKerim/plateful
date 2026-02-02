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

### No Barrel Files

Do not create `index.ts` barrel files for re-exporting. Import directly from source files instead (e.g., `@/hooks/recipe/useRecipe` not `@/hooks/recipe`).

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

## Known Technical Debt & Improvement Areas

### Console Logs in Production Code

Remove debug `console.log()` calls from:
- `src/App.tsx:112-113` (SendIntent data)
- `src/page/URLImport.tsx:65` (recipe import response)
- `src/page/ImageImport.tsx:87` (image import response)
- `src/hooks/general/useScrollRestoration.ts:20` (scroll debug)

### Type Safety — Excessive `any` Usage

Replace `any` with proper types in:
- `src/components/general/MarkdownRenderer.tsx` — all 11 custom component props are `any`
- `src/redux/slices/chatbotSlice.ts:8` — `toolOutputsForUI?: any`
- `src/components/general/AddRecipeDrawer.tsx:21` — `icon: any`
- `src/lib/recipeCategoryHelper/recipeCategoryHelper.ts:9` — `t: any` translation param
- `src/page/Chatbot.tsx:455` — `toolOutput: any`
- `src/page/URLImport.tsx:22` and `src/page/ImageImport.tsx:23` — `data: any` state
- `src/App.tsx:109` — `result: any` for SendIntent

### Code Duplication to Extract

1. **Recipe import logic** — `URLImport.tsx` and `ImageImport.tsx` share near-identical error handling, history replacement, and toast patterns. Extract a `useRecipeImport()` hook.
2. **Recipe save logic** — `Chatbot.tsx:254-334` and `AddRecipe.tsx:221-284` duplicate category validation and recipe creation. Extract a `useRecipeSaver()` hook.
3. **Image compression config** — identical `{ maxWidthOrHeight: 900, maxSizeMB: 0.5, initialQuality: 0.85 }` in `AddRecipe.tsx:199` and `ImageImport.tsx:32`. Extract to a shared constant.

### God Components to Break Up

- **`Chatbot.tsx` (573 lines)** — handles streaming, image selection, recipe saving, category lookups, and rendering. Split into ChatMessageList, ChatInput, RecipeProposal sub-components.
- **`AddRecipe.tsx` (408 lines)** — handles form state, image upload, CRUD, validation. Extract ImageUploadForm and RecipeForm.

### Hardcoded Magic Numbers

- Signed URL expiry `3600` in `src/api/recipe.api.ts:40,54,73` — extract to constant
- React Query timing in `src/main.tsx:19-20` — extract to config
- Default category ID `5` in `src/page/Chatbot.tsx:263,308` — make configurable
- Camera quality `80` in `src/hooks/general/useImageSourcePicker.tsx:84`
- TLD regex `/\.com$|\.de$|\.net$|\.org$/i` in `AddRecipe.tsx:116`

### Race Conditions & Missing Cleanup

- `src/page/URLImport.tsx:27-47` — useEffect depends on `[searchParams]` but calls `handleSave` which may read stale state
- `src/page/Recipe.tsx:58-67` and `src/page/Cookbook.tsx:160-167` — `popstate` listeners can duplicate on remount
- `src/page/URLImport.tsx` and `src/page/ImageImport.tsx` — long-running API calls lack AbortController cancellation on unmount

### Incomplete Features (TODOs)

- `src/App.tsx:90-91` — iOS App Store update flow not implemented
- `src/page/HouseholdSettings.tsx:75-78` — delete household handler is empty (button renders but does nothing)

### Other Issues

- `src/page/Settings.tsx:34-55` — useEffect calls `supabase.auth.getUser()` but could use `useAppSelector(selectUser)` instead
- `src/page/Settings.tsx:42-53` — Canny widget assumes `window.Canny` exists without checking script load
- `src/hooks/user/useUserData.ts:51,66` — language saved to both localStorage and Supabase with no conflict resolution
- `src/utils/nativeClipboard.ts` — hardcoded German strings instead of using i18n
