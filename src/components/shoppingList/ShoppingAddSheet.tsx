import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import ShoppingItemCard from "@/components/shoppingList/ShoppingItemCard";
import { contentLanguage } from "@/lib/contentLanguage";
import {
  nameKey,
  parseTypedLine,
  type ShoppingDictionaryEntry,
  type ShoppingListItem,
  type TypedLine,
} from "@/lib/shopping-list/item";
import {
  addUndo,
  addsNothing,
  previewItem,
  previewLine,
  recentlyBought,
  suggestionItem,
  suggestions,
  type ShoppingSuggestion,
} from "@/lib/shopping-list/list";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ShoppingListItem[];
  dictionary: ShoppingDictionaryEntry[];
  /** Adds a line through the list's one add path. */
  onAdd: (line: TypedLine) => void;
  onPutBack: (id: string) => void;
  /** Takes the last add back: deletes the new item, or takes a put-back off again. */
  onUndo: (undo: "remove" | "takeOff", id: string) => void;
  onDetails: (id: string) => void;
};

/** What the last add did: the card as tapped, and how to find its row. */
type Confirmation = {
  item: ShoppingListItem;
  /** The row's id when the add landed on an item the household had. */
  rowId: string | null;
  wasOnList: boolean;
  undo: "remove" | "takeOff" | null;
};

/**
 * One field for a line ("10 apples"). Empty, it offers what was bought last;
 * typed, the line as it will stand on the list and what it could mean, each row
 * drawn as the list's own card. Return adds the line and keeps the sheet open.
 * After an add the card just added stands where the preview was, above what
 * was bought last: another item under the finger read as "my Backpapier became
 * Klopapier", and the next tap added it (2026-11-08). A tap on that card takes
 * the add back and never adds anything.
 */
export default function ShoppingAddSheet({
  open,
  onOpenChange,
  items,
  dictionary,
  onAdd,
  onPutBack,
  onUndo,
  onDetails,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const line = parseTypedLine(text);
  const preview = line ? previewLine(items, dictionary, line) : null;
  const rows = preview ? suggestions(items, dictionary, preview, contentLanguage()) : [];
  const bought = preview ? [] : recentlyBought(items);

  // The row on the list now: a new item is found by its name once the add lands.
  const addedRow = confirmation
    ? (items.find(
        (item) =>
          item.onList &&
          (confirmation.rowId
            ? item.id === confirmation.rowId
            : nameKey(item.name) === nameKey(confirmation.item.name))
      ) ?? null)
    : null;

  function done(next: Confirmation) {
    setConfirmation(next);
    setText("");
    inputRef.current?.focus();
  }

  /** Adds a line and notes, from the list as it stands, what a tap takes back. */
  function addLine(line: TypedLine) {
    const adding = previewLine(items, dictionary, line);
    onAdd(line);
    done({
      item: previewItem(adding),
      rowId: adding.existing?.id ?? null,
      wasOnList: addsNothing(adding),
      undo: addUndo(adding),
    });
  }

  function putBack(item: ShoppingListItem) {
    onPutBack(item.id);
    done({ item: { ...item, onList: true }, rowId: item.id, wasOnList: false, undo: "takeOff" });
  }

  function addTyped() {
    if (preview) addLine(preview.line);
  }

  function addSuggestion(suggestion: ShoppingSuggestion, typed: TypedLine) {
    if (suggestion.lastBought) putBack(suggestion.lastBought);
    else addLine({ ...typed, name: suggestion.name });
  }

  function undoAdd() {
    if (!confirmation?.undo || !addedRow) return;
    onUndo(confirmation.undo, addedRow.id);
    setConfirmation(null);
    inputRef.current?.focus();
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setText("");
      }}
    >
      <DrawerContent className="h-[90dvh]">
        <DrawerHeader className="gap-3 text-left">
          <DrawerTitle>{t("shoppingList.addSheet.title")}</DrawerTitle>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              addTyped();
            }}
          >
            <Input
              ref={inputRef}
              autoFocus
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                if (event.target.value) setConfirmation(null);
              }}
              placeholder={t("shoppingList.addSheet.placeholder")}
              enterKeyHint="enter"
              autoCorrect="off"
              onDelete={() => {
                setText("");
                inputRef.current?.focus();
              }}
              showDeleteButton={text.length > 0}
              aria-label={t("shoppingList.addSheet.title")}
            />
          </form>
        </DrawerHeader>

        <div className="flex flex-col gap-2.5 overflow-y-auto px-4 pt-0.5 pb-6">
          {preview ? (
            <>
              <ShoppingItemCard
                item={previewItem(preview)}
                onListNow={preview.existing?.onList ? preview.existing : null}
                onClick={addTyped}
              />
              {rows.map((suggestion) => (
                <ShoppingItemCard
                  key={suggestion.id}
                  item={suggestionItem(suggestion, preview.line)}
                  onClick={() => addSuggestion(suggestion, preview.line)}
                />
              ))}
            </>
          ) : (
            <>
              {confirmation && (confirmation.rowId === null || addedRow) && (
                <div className="mb-3.5 flex flex-col gap-1.5">
                  <ShoppingItemCard
                    item={addedRow ?? confirmation.item}
                    highlighted
                    onClick={undoAdd}
                    onDetails={addedRow ? () => onDetails(addedRow.id) : undefined}
                  />
                  <p className="px-1 text-xs text-muted-foreground" aria-live="polite">
                    {confirmation.wasOnList
                      ? t("shoppingList.alreadyOnList")
                      : t(
                          confirmation.undo
                            ? "shoppingList.addSheet.addedUndo"
                            : "shoppingList.addSheet.added"
                        )}
                  </p>
                </div>
              )}
              {bought.length > 0 && (
                <>
                  <h3 className="font-semibold">{t("shoppingList.recentlyBought")}</h3>
                  {bought.map((item) => (
                    <ShoppingItemCard key={item.id} item={item} onClick={() => putBack(item)} />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
