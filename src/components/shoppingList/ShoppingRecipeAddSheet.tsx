import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ServingScaler } from "@/components/ingredients/ServingScaler";
import ShoppingChecklistRow, {
  ShoppingAddButton,
  ShoppingAddedConfirmation,
} from "@/components/shoppingList/ShoppingChecklistRow";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { useIngredientsBundles } from "@/hooks/ingredients/useIngredientsBundles";
import { useShoppingList } from "@/hooks/shopping-list/useShoppingList";
import { useShoppingDictionary } from "@/hooks/shopping-list/useShoppingDictionary";
import { useAddRecipeIngredients } from "@/hooks/shopping-list/useAddRecipeIngredients";
import { contentLanguage } from "@/lib/contentLanguage";
import { shoppingEmoji } from "@/lib/shopping-list/emoji";
import { itemAmountText } from "@/lib/shopping-list/item";
import { checklistIndex } from "@/lib/shopping-list/list";
import { canScale, displayName, listAmount, servingsScale } from "@/lib/shopping-list/planAdd";

type Props = {
  recipeId: string;
  recipeName: string;
  /** The detail's serving count; the sheet changes it too, so the two stay in step. */
  servings: number;
  onServingsChange: (servings: number) => void;
};

type SheetProps = Props & {
  /** Owned by the recipe page, whose actions menu opens the same sheet. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * "Add to list" under a recipe's ingredients, and its sheet: a checklist of the
 * recipe's rows at the detail's serving count, everything on except the
 * staples. Adding merges each line into the household's items on the server;
 * then the sheet says what happened and offers the list.
 */
export default function ShoppingRecipeAddSheet({
  open,
  onOpenChange,
  ...props
}: Readonly<SheetProps>) {
  const { t } = useTranslation();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Button
        variant="secondary"
        className="h-12 w-full rounded-full font-semibold"
        onClick={() => onOpenChange(true)}
      >
        <ShoppingCart />
        {t("shoppingList.addToList")}
      </Button>
      <DrawerContent className="max-h-[90dvh]">
        <Checklist {...props} onClose={() => onOpenChange(false)} />
      </DrawerContent>
    </Drawer>
  );
}

/** Mounted with the sheet's content, so every opening starts from the defaults. */
function Checklist({
  recipeId,
  recipeName,
  servings,
  onServingsChange,
  onClose,
}: Readonly<Props & { onClose: () => void }>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const locale = contentLanguage();
  const householdId = useAppSelector(selectHouseholdId);
  const { data: items = [] } = useShoppingList();
  const { data: dictionary = [] } = useShoppingDictionary();
  const bundles = useIngredientsBundles([recipeId], true);
  const add = useAddRecipeIngredients();
  /** Rows flipped away from their default (on, unless a staple). */
  const [toggled, setToggled] = useState<Set<string>>(new Set());
  const [addedCount, setAddedCount] = useState<number | null>(null);
  const index = useMemo(() => checklistIndex(items, dictionary), [items, dictionary]);

  if (addedCount !== null) {
    return (
      <ShoppingAddedConfirmation
        count={addedCount}
        onOpenList={() => {
          onClose();
          navigate("/shopping");
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  const bundle = bundles.data?.get(recipeId);
  const ingredients = bundle?.ingredients ?? [];
  // Against the rows' own base, never the recipe's cached one.
  const scale = bundle ? servingsScale(servings, bundle.baseServings, ingredients) : 1;
  const isSelected = (id: string, slug: string | null) => !index.isStaple(slug) !== toggled.has(id);
  const selected = ingredients.filter((ingredient) =>
    isSelected(ingredient.id, ingredient.ingredientSlug)
  );

  function toggle(id: string) {
    setToggled((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function submit() {
    if (!householdId) return;
    const lines = selected.map((ingredient) => ({ ingredientId: ingredient.id, scale }));
    add.mutate(
      { householdId, lines, source: "recipe" },
      {
        onSuccess: () => setAddedCount(lines.length),
        onError: () => toast.error(t("shoppingList.writeError")),
      }
    );
  }

  return (
    <>
      <DrawerHeader className="text-left">
        <DrawerTitle>{t("shoppingList.addToList")}</DrawerTitle>
        <DrawerDescription className="line-clamp-2">{recipeName}</DrawerDescription>
        {bundle && canScale(bundle.baseServings, ingredients) && (
          <div className="pt-2">
            <ServingScaler
              value={servings}
              onChange={onServingsChange}
              unit={bundle.servingsUnit ?? "servings"}
            />
          </div>
        )}
      </DrawerHeader>

      <div className="flex flex-col overflow-y-auto px-4">
        {bundle ? (
          ingredients.map((ingredient) => {
            const slug = ingredient.ingredientSlug;
            const name = displayName(ingredient);
            return (
              <ShoppingChecklistRow
                key={ingredient.id}
                isSelected={isSelected(ingredient.id, slug)}
                emoji={shoppingEmoji(slug, name, index.aisle(slug))}
                amount={itemAmountText(listAmount(ingredient, scale), locale)}
                name={name}
                isStaple={index.isStaple(slug)}
                onList={index.isOnList(slug, name)}
                onToggle={() => toggle(ingredient.id)}
              />
            );
          })
        ) : bundles.isError ? (
          <div className="flex items-center gap-3 py-6 text-muted-foreground">
            {t("shoppingList.checklist.loadFailed")}
            <Button variant="ghost" size="sm" onClick={() => void bundles.refetch()}>
              {t("shoppingList.checklist.retry")}
            </Button>
          </div>
        ) : (
          <Loader2 className="mx-auto my-6 animate-spin text-muted-foreground" />
        )}
      </div>

      <DrawerFooter className="pb-8">
        <ShoppingAddButton count={selected.length} isAdding={add.isPending} onAdd={submit} />
      </DrawerFooter>
    </>
  );
}
