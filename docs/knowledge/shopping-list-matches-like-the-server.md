# The shopping list matches and titles like the server

_Since 2026-11-15 the web and Android list recognize a typed name, title a row and spell a suggestion by the same rules as the server and the iOS app. Before, the web had drifted for a month._

What drifted. The server moved recognition to `ingredient_names` on 2026-10-13 (normalize, then exact lookup, the app's language first, no plural endings) and the title rule to the `shopping_item_title` trigger on 2026-11-10. The web kept the old rule: it loaded only the display names from `ingredients`, guessed plural endings, never sent `p_language`, and kept the row's old name. Since 2026-11-10 display names are plural ("Gurken"), so a typed "Gurke" or a synonym such as "Klopapier" previewed as a new item under Other and jumped when the answer landed. An English-language user's "Pepperoni" matched German first and became a chili.

The rules now, all in `src/lib/shopping-list/`:
- The dictionary comes from the `ingredient_dictionary` view with `names_de`/`names_en`; an entry without names matches on its display names.
- `normalize` (`fuzzy.ts`) mirrors `private.shopping_name_norm`: lowercase, ß as ss, accents folded, single spaces, trimmed.
- `dictionaryMatch` (`list.ts`) looks the normalized name up in the app's language, then in the other one. `add_shopping_list_item` and `update_shopping_list_item` get `p_language` from `contentLanguage()`.
- `spellingMatching` (`item.ts`) gives a dictionary suggestion the app-language spelling the query matches best ("2 klopap" offers and saves "Klopapier", not "Toilettenpapier"); the display name wins a tie or when only the other language matches.
- `itemTitle` (`item.ts`) mirrors the trigger: `name_custom` wins; one distinct wording is the title in its newest spelling; several on a row with a slug take the product's display name; a title another row's `name_key` holds is skipped. Every ledger entry the client writes carries its wording as `name` (a put-back carries the row's name).

Renaming to a name that is no dictionary spelling ("Bio-Gurken") re-resolves the slug on the server to none, so the row loses its product and a later "Gurke" makes a new row. That is the server's rule (`update_shopping_list_item`), the same for iOS; rename to a known spelling to keep the product. `editItem` mirrors it, so the optimistic row's picture does not jump. The edit sheet sends the row's current name while its name field is untouched (like the amount): a title that moved with a partner's add while the sheet was open would otherwise be renamed back and marked `name_custom`, which freezes it for good. iOS still sends the prefill.

The add sheet's undo deletes only a row the add itself made (`priorIds`): when the server resolves a line to a row this device did not match (the dictionary not loaded yet), a tap on the added card would otherwise have deleted that row with its history.

Checked 2026-11-15 in Chromium against production as `dev@plateful.test` (household "Uuu"), local build on the dev server: "2 klopap" offered and saved "Klopapier" (`toilet-paper`, household aisle); "Gurke" then "2 Salatgurken" titled the row "Gurken" in the preview, in the optimistic row and in the server's answer; the rename and the note round-tripped; a recipe's line showed as written in the details. The list was restored to its snapshot afterwards. Not checked on an Android device.
