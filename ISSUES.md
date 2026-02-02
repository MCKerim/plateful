# Known Issues & Improvement Areas

## ~~Console Logs in Production Code~~ (RESOLVED)

## ~~Type Safety — Excessive `any` Usage~~ (RESOLVED)

## Code Duplication to Extract

1. **Recipe import logic** — `URLImport.tsx` and `ImageImport.tsx` share near-identical error handling, history replacement, and toast patterns. Extract a `useRecipeImport()` hook.
2. **Recipe save logic** — `Chatbot.tsx:254-334` and `AddRecipe.tsx:221-284` duplicate category validation and recipe creation. Extract a `useRecipeSaver()` hook.
3. ~~**Image compression config**~~ (RESOLVED — extracted to `src/lib/constants.ts`)

## God Components to Break Up

- **`Chatbot.tsx` (573 lines)** — handles streaming, image selection, recipe saving, category lookups, and rendering. Split into ChatMessageList, ChatInput, RecipeProposal sub-components.
- **`AddRecipe.tsx` (408 lines)** — handles form state, image upload, CRUD, validation. Extract ImageUploadForm and RecipeForm.

## Hardcoded Magic Numbers

- ~~Signed URL expiry `3600` in `src/api/recipe.api.ts`~~ (RESOLVED — `SIGNED_URL_EXPIRY_SECONDS`)
- React Query timing in `src/main.tsx:19-20` — extract to config
- Default category ID `5` in `src/page/Chatbot.tsx:263,308` — make configurable
- ~~Camera quality `80` in `src/hooks/general/useImageSourcePicker.tsx`~~ (RESOLVED — `CAMERA_QUALITY`)
- TLD regex `/\.com$|\.de$|\.net$|\.org$/i` in `AddRecipe.tsx:116`

## Race Conditions & Missing Cleanup

- `src/page/URLImport.tsx:27-47` — useEffect depends on `[searchParams]` but calls `handleSave` which may read stale state
- `src/page/Recipe.tsx:58-67` and `src/page/Cookbook.tsx:160-167` — `popstate` listeners can duplicate on remount
- `src/page/URLImport.tsx` and `src/page/ImageImport.tsx` — long-running API calls lack AbortController cancellation on unmount

## Incomplete Features (TODOs)

- `src/App.tsx:90-91` — iOS App Store update flow not implemented
- `src/page/HouseholdSettings.tsx:75-78` — delete household handler is empty (button is now disabled)

## Internationalization Gaps

- `src/page/AddRecipe.tsx` — several hardcoded English toast messages (upload failed, name required, category required, generic error)
- `src/utils/nativeClipboard.ts` — hardcoded German strings instead of using i18n

## Other Issues

- `src/page/Settings.tsx:34-55` — useEffect calls `supabase.auth.getUser()` but could use `useAppSelector(selectUser)` instead
- `src/page/Settings.tsx:42-53` — Canny widget assumes `window.Canny` exists without checking script load
- `src/hooks/user/useUserData.ts:51,66` — language saved to both localStorage and Supabase with no conflict resolution
