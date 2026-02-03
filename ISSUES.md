# Known Issues & Improvement Areas

## ~~Console Logs in Production Code~~ (RESOLVED)

## ~~Type Safety — Excessive `any` Usage~~ (RESOLVED)

## Code Duplication to Extract

1. **Recipe import logic** — `URLImport.tsx` and `ImageImport.tsx` share near-identical error handling, history replacement, and toast patterns. Consider extracting a `useRecipeImport()` hook (medium-risk refactor).
2. **Recipe save logic** — `Chatbot.tsx:254-334` and `AddRecipe.tsx:221-284` duplicate category validation and recipe creation. Consider extracting a `useRecipeSaver()` hook (medium-risk refactor).
3. ~~**Image compression config**~~ (RESOLVED — extracted to `src/lib/constants.ts`)

## God Components to Break Up

- **`Chatbot.tsx` (573 lines)** — handles streaming, image selection, recipe saving, category lookups, and rendering. Split into ChatMessageList, ChatInput, RecipeProposal sub-components.
- **`AddRecipe.tsx` (408 lines)** — handles form state, image upload, CRUD, validation. Extract ImageUploadForm and RecipeForm.

## ~~Hardcoded Magic Numbers~~ (RESOLVED)

All magic numbers have been extracted to `src/lib/constants.ts`:
- ~~Signed URL expiry `3600` in `src/api/recipe.api.ts`~~ → `SIGNED_URL_EXPIRY_SECONDS`
- ~~React Query timing in `src/main.tsx`~~ → `QUERY_STALE_TIME`, `QUERY_GC_TIME`
- ~~Default category ID `5` in `src/page/Chatbot.tsx`~~ → `DEFAULT_CATEGORY_ID`
- ~~Camera quality `80` in `src/hooks/general/useImageSourcePicker.tsx`~~ → `CAMERA_QUALITY`
- ~~TLD regex in `AddRecipe.tsx`~~ → `COMMON_TLD_REGEX`

## ~~Race Conditions & Missing Cleanup~~ (RESOLVED)

- ~~`src/page/URLImport.tsx:27-47` — useEffect depends on `[searchParams]` but calls `handleSave` which may read stale state~~ → Wrapped `handleSave` in `useCallback` with proper dependencies, added `hasProcessedUrlParam` ref to prevent duplicate processing
- ~~`src/page/Recipe.tsx:58-67` and `src/page/Cookbook.tsx:160-167` — `popstate` listeners can duplicate on remount~~ → Already has proper cleanup (listeners are removed on unmount)
- ~~`src/page/URLImport.tsx` and `src/page/ImageImport.tsx` — long-running API calls lack AbortController cancellation on unmount~~ → Added AbortController with cleanup, async operations now check `signal.aborted` before updating state
- ~~`src/page/Settings.tsx:34-55` — useEffect missing `supabase` dependency and no cleanup~~ → Added `supabase` to deps and mounted check for async callback

## Incomplete Features (TODOs)

- `src/App.tsx:90-91` — iOS App Store update flow not implemented
- `src/page/HouseholdSettings.tsx:75-78` — delete household handler is empty (button is now disabled)

## ~~Internationalization Gaps~~ (RESOLVED)

- ~~`src/page/AddRecipe.tsx` — hardcoded English toast messages~~ → Added `addRecipe.errors.*` keys
- ~~`src/utils/nativeClipboard.ts` — hardcoded German strings~~ → Was actually in URLImport.tsx, already fixed

## Other Issues

- `src/page/Settings.tsx:42-53` — Canny widget assumes `window.Canny` exists without checking script load (low priority - guarded by `if (window.Canny)`)
- `src/hooks/user/useUserData.ts:51,66` — language saved to both localStorage and Supabase with no conflict resolution
- `src/App.tsx` — Several useEffects missing dependencies (`supabase`, `fetchUserData`) but require careful restructuring to avoid infinite loops
