# Known Issues & Improvement Areas

## Code Duplication to Extract

1. **Recipe import logic** — `URLImport.tsx` and `ImageImport.tsx` share near-identical error handling, history replacement, and toast patterns. Consider extracting a `useRecipeImport()` hook (medium-risk refactor).
2. **Recipe save logic** — `Chatbot.tsx:254-334` and `AddRecipe.tsx:221-284` duplicate category validation and recipe creation. Consider extracting a `useRecipeSaver()` hook (medium-risk refactor).

## Directory Structure

- `src/utils/` contains mixed concerns: `supabase.tsx` (a React context/provider) and `nativeBrowser.ts`/`nativeClipboard.ts` (Capacitor utilities). The Supabase provider likely belongs in `src/providers/` alongside `RevenueCatProvider.tsx`. Low-priority cleanup.

## Other Issues

- `src/hooks/user/useUserData.ts:51,66` — language saved to both localStorage and Supabase with no conflict resolution
- `src/App.tsx` — `onAuthStateChange` effect (line 220, `[]` deps) and realtime subscription effect (line 238, `[user?.id]` deps) both call `updateUser` via stale closure. Fix: wrap `updateUser` in `useCallback([fetchUserData])` and add it to both effect dep arrays. Check `fetchUserData` in `useUserData` is already stable before doing this. Low practical risk since both effects fire infrequently.
- `src/utils/` — `supabase.tsx` (React provider) belongs in `src/providers/`; `nativeBrowser.ts`/`nativeClipboard.ts` belong in `src/lib/`. Blocked by 62 import sites — pure cosmetic cleanup, no functional benefit.
