# Known Issues & Improvement Areas

## Code Duplication to Extract

1. **Recipe import logic** — `URLImport.tsx` and `ImageImport.tsx` share near-identical error handling, history replacement, and toast patterns. Consider extracting a `useRecipeImport()` hook (medium-risk refactor).
2. **Recipe save logic** — `Chatbot.tsx:254-334` and `AddRecipe.tsx:221-284` duplicate category validation and recipe creation. Consider extracting a `useRecipeSaver()` hook (medium-risk refactor).

## Other Issues

- `src/hooks/user/useUserData.ts:51,66` — language saved to both localStorage and Supabase with no conflict resolution
- `src/App.tsx` — Several useEffects missing dependencies (`supabase`, `fetchUserData`) but require careful restructuring to avoid infinite loops
