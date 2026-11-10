# Shopping add sheet: the added card stays on top

_After an add the card just added stands where the preview was, above "Zuletzt gekauft"; a tap takes the add back; only toilet paper and kitchen roll show the roll. Built 2026-11-10 after the iOS app, not released yet (Android 1.6 does not have it)._

What happened: on 2026-11-08 a "Backpapier" typed in the Android app seemed to turn into "Klopapier". Nothing was matched wrongly. The preview card showed 🧻 because that was the household aisle's fallback emoji, and after the tap the field cleared and "Zuletzt gekauft" took the preview's place with "🧻 Klopapier" first, which the next tap put on the list (PostHog autocapture; the full trail is in the iOS repo, `docs/ingredient-data-plan.md`, fourth handover).

Now, as in iOS (`ShoppingAddSheet.swift`, the iOS repo's `docs/knowledge/shopping-list.md`):
- `ShoppingAddSheet` keeps a `Confirmation` (the card as tapped, the row's id when the household had the item, what a tap takes back) until the next line is typed. The card is outlined (`highlighted`), with "Hinzugefügt. Tippen zum Entfernen." under it; it replaces the two-second text under the field (`addSheet.added` is now the short form, `addSheet.addedUndo` is new, `addSheet.alreadyOnList` is gone, the card's `shoppingList.alreadyOnList` is used).
- `addUndo(preview)` in `lib/shopping-list/list.ts` decides before the add: no item of that name means the add makes one, so the tap deletes it (`useDeleteShoppingItem`); a bought item that comes back is taken off again (`useSetOnList` with `onList: false`, which counts one more purchase because the server stamps every `on_list` flip); an amount added to an item on the list, or a line that only pointed at one, has no undo.
- A new item's row is found by its name once the optimistic add is in the list; until then, and if the server answers with a row of another name, the card shows the snapshot without undo and without the info button.
- The info button opens the item's details. The page shows one sheet at a time, so the add sheet closes then (iOS stacks the two).
- `aisle.ts`: household falls back to 🧹. `emoji.ts`: `toilet-paper` and `kitchen-roll` 🧻, `baking-paper` and a typed "Backpapier" 📜. The tables are in step with `ShoppingEmoji.swift` again.

Checked 2026-11-10 on the dev server at phone width with the dev account: "Backpapier" added (📜, outlined, info button), a tap removed it; "Äpfel" put back from recently bought, a tap took it off again; the info button opened the details. 480 tests green. Not checked on an Android device.
