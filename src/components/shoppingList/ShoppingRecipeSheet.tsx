import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShoppingCart } from "lucide-react";
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
import { shoppingEmoji } from "@/lib/shopping-list/emoji";
import { isFromRecipe, itemAmountText, keeping } from "@/lib/shopping-list/item";
import type { TripRecipe } from "@/lib/shopping-list/list";

type Props = {
  /** The recipe, read live from the trip; null closes the sheet. */
  recipe: TripRecipe | null;
  onClose: () => void;
  coverUrls: Map<string, string | null>;
  onOpenRecipe: (recipeId: string) => void;
  onRemove: (recipe: TripRecipe) => void;
};

/**
 * One recipe on the trip: the items it put on the list with its share, what
 * stays when it goes, and "Remove from list". Cover and name open the recipe.
 */
export default function ShoppingRecipeSheet({
  recipe,
  onClose,
  coverUrls,
  onOpenRecipe,
  onRemove,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const byline = useShoppingByline();
  const locale = contentLanguage();
  const [shown, setShown] = useState(recipe);
  if (recipe && recipe !== shown) setShown(recipe);
  if (!shown) return null;

  const exists = coverUrls.has(shown.id);
  const subtitle = [
    shown.timesAdded > 1 ? t("shoppingList.recipe.addedTimes", { count: shown.timesAdded }) : null,
    byline(shown.addedBy, shown.addedAt),
  ]
    .filter(Boolean)
    .join(" · ");
  const header = (
    <>
      <span className="size-16 shrink-0 overflow-hidden rounded-2xl">
        <RecipeCover url={coverUrls.get(shown.id)} exists={exists} />
      </span>
      <span className="flex min-w-0 flex-col gap-1 text-left">
        <DrawerTitle className="line-clamp-2">{shown.name}</DrawerTitle>
        {subtitle && <DrawerDescription>{subtitle}</DrawerDescription>}
      </span>
    </>
  );

  return (
    <Drawer open={recipe !== null} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90dvh]">
        <DrawerHeader>
          {exists ? (
            <button
              type="button"
              className="flex items-center gap-3.5"
              onClick={() => onOpenRecipe(shown.id)}
              aria-description={t("shoppingList.recipe.open")}
            >
              {header}
            </button>
          ) : (
            <div className="flex items-center gap-3.5">{header}</div>
          )}
        </DrawerHeader>

        <div className="flex flex-col gap-2 overflow-y-auto px-4">
          <h3 className="text-sm font-semibold text-muted-foreground">
            {t("shoppingList.recipe.onList")}
          </h3>
          {shown.items.map((item) => {
            const share = itemAmountText(
              keeping(item, (source) => isFromRecipe(source, shown.id)),
              locale
            );
            const rest = keeping(item, (source) => !isFromRecipe(source, shown.id));
            const remaining = itemAmountText(rest, locale);
            return (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-card p-2.5">
                <span
                  className="flex size-11 shrink-0 items-center justify-center text-[28px]"
                  aria-hidden
                >
                  {shoppingEmoji(item.ingredientSlug, item.name, item.aisle)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="line-clamp-2 text-sm font-medium">{item.name}</span>
                  {rest.sources.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {remaining
                        ? t("shoppingList.recipe.staysWith", { amount: remaining })
                        : t("shoppingList.recipe.stays")}
                    </span>
                  )}
                </span>
                {share && <span className="text-sm font-semibold tabular-nums">{share}</span>}
              </div>
            );
          })}
        </div>

        <DrawerFooter className="pb-8">
          <DeleteDialog
            title={t("shoppingList.recipe.removeTitle")}
            description={
              shown.timesAdded > 1
                ? t("shoppingList.recipe.removeMessageTimes", {
                    name: shown.name,
                    count: shown.timesAdded,
                  })
                : t("shoppingList.recipe.removeMessage", { name: shown.name })
            }
            confirmText={t("common.remove")}
            onDelete={() => onRemove(shown)}
            customTrigger={
              <Button variant="secondary" size="lg" className="rounded-full text-destructive">
                <ShoppingCart />
                {t("shoppingList.recipe.remove")}
              </Button>
            }
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
