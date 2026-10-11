import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { isToday } from "date-fns";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ServingScaler } from "@/components/ingredients/ServingScaler";
import RecipeCover from "@/components/shoppingList/RecipeCover";
import ShoppingChecklistRow, {
  ShoppingAddButton,
  ShoppingAddedConfirmation,
  ShoppingCheckMark,
} from "@/components/shoppingList/ShoppingChecklistRow";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { useRecipes } from "@/hooks/cookbook/useRecipes";
import { useIngredientsBundles } from "@/hooks/ingredients/useIngredientsBundles";
import { useShoppingList } from "@/hooks/shopping-list/useShoppingList";
import { useShoppingDictionary } from "@/hooks/shopping-list/useShoppingDictionary";
import { useAddRecipeIngredients } from "@/hooks/shopping-list/useAddRecipeIngredients";
import { contentLanguage } from "@/lib/contentLanguage";
import { cn } from "@/lib/utils";
import { shoppingEmoji } from "@/lib/shopping-list/emoji";
import { itemAmountText } from "@/lib/shopping-list/item";
import { aisleSections, checklistIndex, tripRecipes } from "@/lib/shopping-list/list";
import {
  canScale,
  isSelectedByDefault,
  planDays,
  planLines,
  planPortions,
  type PlanMeal,
} from "@/lib/shopping-list/planAdd";

type Props = {
  /** The shown week's meals when the cart was tapped (`planMeals`); null closes the sheet. */
  meals: PlanMeal[] | null;
  onClose: () => void;
};

/**
 * The planner's week onto the list, in two steps. First the meals: every
 * placement still to cook a row under its day, the pool first, each with a
 * serving count of its own (the sheet's only; the plan keeps none); a repeat
 * and a recipe already on the list start off. Then one checklist of the
 * selected meals' rows merged the way the list will hold them, staples off.
 * Adding is one call with every row at its recipe's scale.
 */
export default function ShoppingPlanAddSheet({ meals, onClose }: Readonly<Props>) {
  const [shown, setShown] = useState(meals);
  if (meals && meals !== shown) setShown(meals);

  return (
    <Drawer open={meals !== null} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="h-[90dvh]">
        {shown && <Steps meals={shown} onClose={onClose} />}
      </DrawerContent>
    </Drawer>
  );
}

function flipped(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (!next.delete(id)) next.add(id);
  return next;
}

/** Mounted with the sheet's content, so every opening starts from the defaults. */
function Steps({ meals, onClose }: Readonly<{ meals: PlanMeal[]; onClose: () => void }>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const locale = contentLanguage();
  const householdId = useAppSelector(selectHouseholdId);
  const { data: items } = useShoppingList();
  const { data: dictionary = [] } = useShoppingDictionary();
  const { data: recipes } = useRecipes();
  const bundlesQuery = useIngredientsBundles(
    meals.map((meal) => meal.recipeId),
    true
  );
  const bundles = bundlesQuery.data;
  const add = useAddRecipeIngredients();
  const [step, setStep] = useState<"meals" | "ingredients">("meals");
  // The recipes on the list when the sheet opened: a later change underneath
  // must not swap the defaults out from under the user's flips.
  const [onList, setOnList] = useState<Set<string> | null>(null);
  if (onList === null && items) {
    setOnList(new Set(tripRecipes(aisleSections(items)).map((recipe) => recipe.id)));
  }
  /** Placements and lines the user flipped away from their defaults. */
  const [toggledMeals, setToggledMeals] = useState<Set<string>>(new Set());
  const [toggledLines, setToggledLines] = useState<Set<string>>(new Set());
  /** Serving counts changed by hand, by placement id; the rest cook at base. */
  const [servings, setServings] = useState<Record<string, number>>({});
  const [addedCount, setAddedCount] = useState<number | null>(null);
  const index = useMemo(() => checklistIndex(items ?? [], dictionary), [items, dictionary]);
  const coverUrls = useMemo(
    () => new Map((recipes ?? []).map((recipe) => [recipe.id, recipe.imageUrl])),
    [recipes]
  );

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

  const onListIds = onList ?? new Set<string>();
  const bundleOf = (meal: PlanMeal) => bundles?.get(meal.recipeId);
  const hasNoIngredients = (meal: PlanMeal) => bundleOf(meal)?.ingredients.length === 0;
  const isSelected = (meal: PlanMeal) =>
    !hasNoIngredients(meal) && isSelectedByDefault(meal, onListIds) !== toggledMeals.has(meal.id);
  const servingsOf = (meal: PlanMeal) => servings[meal.id] ?? bundleOf(meal)?.baseServings ?? 1;
  const mealCanScale = (meal: PlanMeal) => {
    const bundle = bundleOf(meal);
    return bundle !== undefined && canScale(bundle.baseServings, bundle.ingredients);
  };
  const selectedMeals = meals.filter(isSelected);
  const lines = bundles ? planLines(planPortions(selectedMeals, servingsOf, bundles), index) : [];
  const isLineSelected = (line: (typeof lines)[number]) =>
    !line.isStaple !== toggledLines.has(line.id);
  const selectedLines = lines.filter(isLineSelected);

  const dayFormat = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
  const dayLabel = (day: Date | null) =>
    day === null
      ? t("mealPlanner.noDate")
      : isToday(day)
        ? t("common.today")
        : dayFormat.format(day);

  /** "Also Tue 13/10 · 4 servings · On the list"; null when there is nothing to say. */
  function caption(meal: PlanMeal): string | null {
    const parts: string[] = [];
    const elsewhere = meals
      .filter((other) => other.recipeId === meal.recipeId && other.id !== meal.id)
      .map((other) => dayLabel(other.day));
    if (elsewhere.length > 0) {
      const days = elsewhere.join(", ");
      parts.push(t("shoppingList.planAdd.also", { days }));
    }
    const bundle = bundleOf(meal);
    if (hasNoIngredients(meal)) {
      parts.push(t("shoppingList.planAdd.noIngredients"));
    } else {
      if (bundle && !mealCanScale(meal) && bundle.baseServings) {
        const unit = bundle.servingsUnit ?? "servings";
        parts.push(
          `${bundle.baseServings} ${t(`ingredients.units.${unit}`, { defaultValue: unit })}`
        );
      }
      if (onListIds.has(meal.recipeId)) parts.push(t("shoppingList.checklist.onList"));
    }
    return parts.length > 0 ? parts.join(" · ") : null;
  }

  function submit() {
    if (!householdId) return;
    const sent = selectedLines.flatMap((line) => line.ingredients);
    add.mutate(
      { householdId, lines: sent, source: "plan" },
      {
        onSuccess: () => setAddedCount(selectedLines.length),
        onError: () => toast.error(t("shoppingList.writeError")),
      }
    );
  }

  if (step === "ingredients") {
    return (
      <>
        <DrawerHeader className="flex items-center gap-2 text-left">
          <Button
            variant="secondary"
            size="icon"
            className="size-9 shrink-0 rounded-full"
            aria-label={t("shoppingList.planAdd.back")}
            onClick={() => setStep("meals")}
          >
            <ChevronLeft />
          </Button>
          <DrawerTitle>{t("shoppingList.planAdd.pickIngredients")}</DrawerTitle>
        </DrawerHeader>
        <div key="ingredients" className="flex flex-1 flex-col overflow-y-auto px-4">
          {lines.map((line) => (
            <ShoppingChecklistRow
              key={line.id}
              isSelected={isLineSelected(line)}
              emoji={shoppingEmoji(line.item.ingredientSlug, line.item.name, line.item.aisle)}
              amount={itemAmountText(line.item, locale)}
              name={line.item.name}
              isStaple={line.isStaple}
              onList={index.isOnList(line.item.ingredientSlug, line.item.name)}
              covers={line.recipeIds.map((id) => coverUrls.get(id) ?? null)}
              onToggle={() => setToggledLines((current) => flipped(current, line.id))}
            />
          ))}
        </div>
        <DrawerFooter className="pb-8">
          <ShoppingAddButton count={selectedLines.length} isAdding={add.isPending} onAdd={submit} />
        </DrawerFooter>
      </>
    );
  }

  return (
    <>
      <DrawerHeader className="text-left">
        <DrawerTitle>{t("shoppingList.planAdd.pickMeals")}</DrawerTitle>
      </DrawerHeader>
      <div key="meals" className="flex flex-1 flex-col gap-6 overflow-y-auto px-4">
        {meals.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            {t("shoppingList.planAdd.nothingToCook")}
          </p>
        )}
        {planDays(meals).map((day) => (
          <section key={day.day?.getTime() ?? "pool"} className="flex flex-col gap-2.5">
            <h3 className="font-semibold">{dayLabel(day.day)}</h3>
            <div className="rounded-2xl bg-card">
              {day.meals.map((meal, position) => {
                const selected = isSelected(meal);
                const url = coverUrls.get(meal.recipeId) ?? null;
                const note = caption(meal);
                return (
                  <Fragment key={meal.id}>
                    {position > 0 && <div className="ml-[114px] border-t" />}
                    <div className="flex items-center gap-3 p-3">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={selected}
                        disabled={hasNoIngredients(meal)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        onClick={() => setToggledMeals((current) => flipped(current, meal.id))}
                      >
                        <ShoppingCheckMark isSelected={selected} />
                        <span
                          className={cn(
                            "size-[52px] shrink-0 overflow-hidden rounded-xl",
                            !selected && "grayscale"
                          )}
                        >
                          <RecipeCover url={url} exists />
                        </span>
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span
                            className={cn(
                              "line-clamp-2 font-medium",
                              !selected && "text-muted-foreground"
                            )}
                          >
                            {meal.recipeName}
                          </span>
                          {note && <span className="text-xs text-muted-foreground">{note}</span>}
                        </span>
                      </button>
                      {selected && mealCanScale(meal) && (
                        <ServingScaler
                          compact
                          value={servingsOf(meal)}
                          onChange={(value) =>
                            setServings((current) => ({ ...current, [meal.id]: value }))
                          }
                        />
                      )}
                    </div>
                  </Fragment>
                );
              })}
            </div>
          </section>
        ))}
        {!bundles &&
          (bundlesQuery.isError ? (
            <div className="flex items-center gap-3 py-6 text-muted-foreground">
              {t("shoppingList.checklist.loadFailed")}
              <Button variant="ghost" size="sm" onClick={() => void bundlesQuery.refetch()}>
                {t("shoppingList.checklist.retry")}
              </Button>
            </div>
          ) : (
            <Loader2 className="mx-auto my-6 animate-spin text-muted-foreground" />
          ))}
      </div>
      <DrawerFooter className="pb-8">
        <Button
          variant="accent"
          size="lg"
          className="w-full rounded-full"
          disabled={!bundles || selectedMeals.length === 0}
          onClick={() => setStep("ingredients")}
        >
          {t("common.next")}
        </Button>
      </DrawerFooter>
    </>
  );
}
