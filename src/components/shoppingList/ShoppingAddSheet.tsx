import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import ShoppingItemCard from "@/components/shoppingList/ShoppingItemCard";
import { contentLanguage } from "@/lib/contentLanguage";
import {
  parseTypedLine,
  type ShoppingDictionaryEntry,
  type ShoppingListItem,
  type TypedLine,
} from "@/lib/shopping-list/item";
import {
  addsNothing,
  previewItem,
  previewLine,
  previewName,
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
};

type Confirmation = { name: string; wasOnList: boolean };

/**
 * One field for a line ("10 apples"). Empty, it offers what was bought last;
 * typed, the line as it will stand on the list and what it could mean, each row
 * drawn as the list's own card. Return adds the line and keeps the sheet open.
 */
export default function ShoppingAddSheet({
  open,
  onOpenChange,
  items,
  dictionary,
  onAdd,
  onPutBack,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!confirmation) return;
    const timer = setTimeout(() => setConfirmation(null), 2000);
    return () => clearTimeout(timer);
  }, [confirmation]);

  const line = parseTypedLine(text);
  const preview = line ? previewLine(items, dictionary, line) : null;
  const rows = preview ? suggestions(items, dictionary, preview, contentLanguage()) : [];
  const bought = preview ? [] : recentlyBought(items);

  function done(name: string, wasOnList = false) {
    setConfirmation({ name, wasOnList });
    setText("");
    inputRef.current?.focus();
  }

  function addTyped() {
    if (!preview) return;
    onAdd(preview.line);
    done(previewName(preview), addsNothing(preview));
  }

  function addSuggestion(suggestion: ShoppingSuggestion, typed: TypedLine) {
    if (suggestion.lastBought) onPutBack(suggestion.lastBought.id);
    else onAdd({ ...typed, name: suggestion.name });
    done(suggestion.name);
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
              onChange={(event) => setText(event.target.value)}
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
          <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
            {confirmation &&
              t(
                confirmation.wasOnList
                  ? "shoppingList.addSheet.alreadyOnList"
                  : "shoppingList.addSheet.added",
                {
                  name: confirmation.name,
                }
              )}
          </p>
        </DrawerHeader>

        <div className="flex flex-col gap-2.5 overflow-y-auto px-4 pb-6">
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
            bought.length > 0 && (
              <>
                <h3 className="font-semibold">{t("shoppingList.recentlyBought")}</h3>
                {bought.map((item) => (
                  <ShoppingItemCard
                    key={item.id}
                    item={item}
                    onClick={() => {
                      onPutBack(item.id);
                      done(item.name);
                    }}
                  />
                ))}
              </>
            )
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
