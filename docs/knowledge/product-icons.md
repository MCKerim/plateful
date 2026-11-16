# Product icons replace the shopping emoji

_Since 2026-11-16 (not released) every shopping picture is `ProductIcon`: the dictionary's `icon_path` from the public `product-icons` bucket, else the aisle's paper bag from `public/product-bags/<aisle>.webp`; `emoji.ts` is gone. Same rule as the native app's `ProductIcon.swift`._

- **Data:** `ingredient_dictionary.icon_path` (migration `20261115220657_product_icons` in the iOS repo), parsed into `ShoppingDictionaryEntry.iconPath`. The file name carries a content hash, so the bucket serves `max-age=31536000` and the WebView's HTTP cache keeps every icon; a regenerated icon gets a new path. Variants share their base product's file (low-fat cottage cheese shows cottage cheese).
- **Component:** `src/components/shoppingList/ProductIcon.tsx` reads the dictionary through `useShoppingDictionary` (one React Query cache, so it works in any sheet, unlike the iOS environment lookup that broke the native add sheet) and builds the slug → path map once per loaded dictionary (`WeakMap`). An `<img>` shows nothing while it loads, a failed icon falls back to the bag. A row without a slug shows its aisle's bag; the old word matching ("Bio-Äpfel" → 🍎) is gone.
- **Bags:** 14 WebPs (192 px, 104 KB together) in `public/`, so they ship with the web build and the APK and need no network. Ids are the aisle ids in `aisle.ts`.
- **Verified 2026-11-16:** dev server signed in with the dev account against production: list and add sheet show icons and bags, no failed requests. Unit tests and the shopping E2E spec green in Chromium (Firefox and WebKit are not installed locally). Not checked on the Android emulator.
- **Generating, publishing, rules:** iOS repo `docs/knowledge/product-icons.md`.
