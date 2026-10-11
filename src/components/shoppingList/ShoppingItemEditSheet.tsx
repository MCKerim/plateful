import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  isDuplicateNameError,
  useEditShoppingItem,
} from "@/hooks/shopping-list/useEditShoppingItem";
import { contentLanguage } from "@/lib/contentLanguage";
import { AISLES, type ShoppingAisle } from "@/lib/shopping-list/aisle";
import { itemAmountText, type ShoppingListItem } from "@/lib/shopping-list/item";
import { editProblem } from "@/lib/shopping-list/list";

type Props = {
  householdId: string;
  /** The item being edited; null closes the sheet. */
  item: ShoppingListItem | null;
  items: ShoppingListItem[];
  onClose: () => void;
};

/** Name, this trip's amount set outright, and the aisle, in one save. */
export default function ShoppingItemEditSheet({
  householdId,
  item,
  items,
  onClose,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const editItem = useEditShoppingItem();
  const [openedFor, setOpenedFor] = useState<ShoppingListItem | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [prefill, setPrefill] = useState("");
  const [aisle, setAisle] = useState<ShoppingAisle>("other");
  const [error, setError] = useState<string | null>(null);

  // Each opening starts from the item as it is (state adjusted during render);
  // the last item stays shown through the closing animation.
  const [wasOpen, setWasOpen] = useState(false);
  if ((item !== null) !== wasOpen) {
    setWasOpen(item !== null);
  }
  if (item && !wasOpen) {
    const text = itemAmountText(item, contentLanguage());
    setOpenedFor(item);
    setName(item.name);
    setAmount(text);
    setPrefill(text);
    setAisle(item.aisle);
    setError(null);
  }
  const shown = item ?? openedFor;

  async function save() {
    if (!shown || editItem.isPending) return;
    const problem = editProblem(items, shown.id, name);
    if (problem) {
      setError(t(`shoppingList.edit.${problem}`));
      return;
    }
    try {
      await editItem.mutateAsync({
        householdId,
        item: shown,
        name,
        // The prefill is rounded text; untouched, the stored amount goes as it is.
        amountText: amount === prefill ? null : amount,
        aisle,
      });
      onClose();
    } catch (saveError) {
      setError(
        isDuplicateNameError(saveError) ? t("shoppingList.edit.duplicateName") : t("common.error")
      );
    }
  }

  return (
    <Drawer
      open={item !== null}
      onOpenChange={(open) => {
        if (!open && !editItem.isPending) onClose();
      }}
    >
      <DrawerContent className="max-h-[90dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>{t("shoppingList.edit.title")}</DrawerTitle>
        </DrawerHeader>
        <form
          className="flex flex-col gap-4 overflow-y-auto px-4"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="shopping-edit-name">{t("shoppingList.edit.name")}</Label>
            <Input
              id="shopping-edit-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoCorrect="off"
              disabled={editItem.isPending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="shopping-edit-amount">{t("shoppingList.edit.amount")}</Label>
            <Input
              id="shopping-edit-amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder={t("shoppingList.edit.amountPlaceholder")}
              autoCorrect="off"
              disabled={editItem.isPending}
            />
            {shown && !shown.onList && (
              <p className="text-sm text-muted-foreground">{t("shoppingList.edit.boughtHint")}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("shoppingList.edit.aisle")}</Label>
            <Select
              value={aisle}
              onValueChange={(value) => setAisle(value as ShoppingAisle)}
              disabled={editItem.isPending}
            >
              <SelectTrigger aria-label={t("shoppingList.edit.aisle")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AISLES.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {t(entry.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              <span className="font-semibold">{t("shoppingList.edit.saveError")}.</span> {error}
            </p>
          )}
        </form>
        <DrawerFooter className="pb-8">
          <Button
            size="lg"
            className="rounded-full"
            onClick={() => void save()}
            disabled={!name.trim() || editItem.isPending}
          >
            {editItem.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
