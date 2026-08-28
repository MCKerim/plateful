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

## Restyling follow-ups (2026-08-25)

The mascot and app icon moved to the approved ceramic-salad identity
(`docs/brand/` in the iOS repo). These surfaces still carry the old look and
were deliberately left out of that pass:

**Deferred by decision — not bugs, waiting on a call**

- **Warm-neutral palette** — `src/index.css` still runs the pre-brand-lock
  palette (`#faf9f5` / `#1b1602` / `#edece8`, terracotta destructive). The iOS
  app deliberately went to system surfaces instead. Either follow chapter 06 or
  consciously keep this app on its own palette.

**Still old art**

- **Favicon is an interim.** The tab icon is now the mascot, but brand chapter 04
  puts the compact brand mark here and that is still "pending / not designed".
  At 16px the detailed bowl is mush — same call the website made, same limit.
- **Capacitor iOS target** — `ios/App/App/Assets.xcassets/{AppIcon,Splash}` are
  the old art. Never built or shipped, so cosmetic only.
