import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import DeleteDialog from "@/components/general/DeleteDialog";
import RecipeCover from "@/components/shoppingList/RecipeCover";
import { useShoppingByline } from "@/hooks/shopping-list/useShoppingByline";
import { contentLanguage } from "@/lib/contentLanguage";
import { aisleInfo } from "@/lib/shopping-list/aisle";
import { shoppingEmoji } from "@/lib/shopping-list/emoji";
import {
  itemAmountText,
  type ShoppingItemSource,
  type ShoppingListItem,
} from "@/lib/shopping-list/item";

type Props = {
  /** The item, read live from the list; null closes the sheet. */
  item: ShoppingListItem | null;
  onClose: () => void;
  coverUrls: Map<string, string | null>;
  onEdit: (item: ShoppingListItem) => void;
  onRemove: (item: ShoppingListItem) => void;
  onOpenRecipe: (recipeId: string) => void;
};

const GLYPHS: Record<Exclude<ShoppingItemSource["kind"], "recipe">, string> = {
  manual: "✋",
  set: "✍️",
};

/**
 * Where an item's amount comes from: its picture, name, amount and aisle, then
 * the trip's ledger newest first (a recipe's cover opens the recipe), with
 * Edit and Remove at the bottom.
 */
export default function ShoppingItemDetailSheet({
  item,
  onClose,
  coverUrls,
  onEdit,
  onRemove,
  onOpenRecipe,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const byline = useShoppingByline();
  const locale = contentLanguage();
  // The last item shown stays through the closing animation.
  const [shown, setShown] = useState(item);
  if (item && item !== shown) setShown(item);
  if (!shown) return null;

  const amount = itemAmountText(shown, locale);
  const aisle = t(aisleInfo(shown.aisle).labelKey);

  function title(source: ShoppingItemSource) {
    if (source.kind === "recipe") return source.recipeName ?? t("shoppingList.detail.recipe");
    if (source.kind === "manual") return t("shoppingList.detail.byHand");
    return itemAmountText(source, locale)
      ? t("shoppingList.detail.amountSet")
      : t("shoppingList.detail.amountCleared");
  }

  function sourceRow(source: ShoppingItemSource, index: number) {
    const recipeId = source.kind === "recipe" ? source.recipeId : null;
    const opens = recipeId !== null && coverUrls.has(recipeId);
    const sourceAmount = itemAmountText(source, locale);
    const who = byline(source.addedBy, source.addedAt);
    const content = (
      <>
        <span className="size-11 shrink-0 overflow-hidden rounded-xl">
          <RecipeCover
            url={recipeId ? coverUrls.get(recipeId) : null}
            exists={opens}
            glyph={source.kind === "recipe" ? undefined : GLYPHS[source.kind]}
          />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="line-clamp-2 text-sm font-medium">{title(source)}</span>
          {who && <span className="text-xs text-muted-foreground">{who}</span>}
        </span>
        {sourceAmount && <span className="text-sm font-semibold tabular-nums">{sourceAmount}</span>}
        {opens && <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
      </>
    );
    const className = "flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left";
    return opens ? (
      <button
        key={index}
        type="button"
        className={className}
        onClick={() => onOpenRecipe(recipeId)}
      >
        {content}
      </button>
    ) : (
      <div key={index} className={className}>
        {content}
      </div>
    );
  }

  return (
    <Drawer open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90dvh]">
        <DrawerHeader className="flex items-center gap-3.5 text-left">
          <span className="flex size-16 shrink-0 items-center justify-center text-5xl" aria-hidden>
            {shoppingEmoji(shown.ingredientSlug, shown.name, shown.aisle)}
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <DrawerTitle className="line-clamp-2">{shown.name}</DrawerTitle>
            <DrawerDescription>{amount ? `${amount} · ${aisle}` : aisle}</DrawerDescription>
          </span>
        </DrawerHeader>

        {shown.onList && (
          <div className="flex flex-col gap-2 overflow-y-auto px-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {t("shoppingList.detail.addedFrom")}
            </h3>
            {shown.sources.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                {t("shoppingList.detail.nothingRecorded")}
              </p>
            ) : (
              [...shown.sources].reverse().map(sourceRow)
            )}
          </div>
        )}

        <DrawerFooter className="flex-row gap-2.5 pb-8">
          <DeleteDialog
            title={t("shoppingList.detail.removeTitle")}
            description={t("shoppingList.detail.removeMessage")}
            confirmText={t("common.remove")}
            onDelete={() => onRemove(shown)}
            customTrigger={
              <Button
                variant="secondary"
                size="lg"
                className="flex-1 rounded-full text-destructive"
              >
                <Trash2 />
                {t("common.remove")}
              </Button>
            }
          />
          <Button size="lg" className="flex-1 rounded-full" onClick={() => onEdit(shown)}>
            <Pencil />
            {t("common.edit")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
