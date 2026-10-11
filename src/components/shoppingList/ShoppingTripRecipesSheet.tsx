import { useTranslation } from "react-i18next";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import RecipeCover from "@/components/shoppingList/RecipeCover";
import { useShoppingByline } from "@/hooks/shopping-list/useShoppingByline";
import type { TripRecipe } from "@/lib/shopping-list/list";

type Props = {
  open: boolean;
  onClose: () => void;
  tripRecipes: TripRecipe[];
  coverUrls: Map<string, string | null>;
  onSelect: (recipe: TripRecipe) => void;
};

/** The recipes this trip is for, when there are several; a row opens its sheet. */
export default function ShoppingTripRecipesSheet({
  open,
  onClose,
  tripRecipes,
  coverUrls,
  onSelect,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const byline = useShoppingByline();

  return (
    <Drawer open={open && tripRecipes.length > 0} onOpenChange={(next) => !next && onClose()}>
      <DrawerContent className="max-h-[90dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>{t("shoppingList.recipes.title")}</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-2 overflow-y-auto px-4 pb-8">
          {tripRecipes.map((recipe) => {
            const caption = [
              t("shoppingList.recipes.items", { count: recipe.items.length }),
              recipe.timesAdded > 1
                ? t("shoppingList.recipes.times", { count: recipe.timesAdded })
                : null,
              byline(recipe.addedBy, recipe.addedAt),
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <button
                key={recipe.id}
                type="button"
                className="flex items-center gap-3 rounded-2xl bg-card p-2.5 text-left"
                onClick={() => onSelect(recipe)}
              >
                <span className="size-[52px] shrink-0 overflow-hidden rounded-xl">
                  <RecipeCover url={coverUrls.get(recipe.id)} exists={coverUrls.has(recipe.id)} />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="line-clamp-2 text-sm font-semibold">{recipe.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{caption}</span>
                </span>
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
