# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start dev server with hot reload (--host enabled)
npm run build        # TypeScript check + Vite production build
npm run lint         # Run ESLint
npm run test         # Run Vitest tests
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
- `src/api/` - API layer functions
- `src/hooks/` - Custom React hooks
- `src/redux/slices/` - Redux slices (user, household, chatbot, filterAndSorting)
- `src/lib/query-keys.ts` - React Query key factory for cache management
- `src/types/database.types.ts` - Auto-generated Supabase types
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
