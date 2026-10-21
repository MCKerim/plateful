import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScaledIngredients } from "@/hooks/ingredients/useScaledIngredients";
import { groupIngredients } from "@/lib/transformers/ingredient.transformer";
import { ServingScaler } from "./ServingScaler";
import ShoppingRecipeAddSheet from "@/components/shoppingList/ShoppingRecipeAddSheet";
import { IngredientRow } from "./IngredientRow";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectTargetServings,
  setTargetServings as setTargetServingsAction,
  clearTargetServings,
} from "@/redux/slices/servingsSlice";
import { useUpdateBaseServings } from "@/hooks/recipe/useUpdateBaseServings";
import { toast } from "sonner";

type Props = {
  recipeId: string;
  recipeName: string;
  baseServings: number | null;
  servingsUnit?: string;
  showScalingControls?: boolean;
  addToListOpen: boolean;
  onAddToListOpenChange: (open: boolean) => void;
};

export function IngredientList({
  recipeId,
  recipeName,
  baseServings,
  servingsUnit = "servings",
  showScalingControls = true,
  addToListOpen,
  onAddToListOpenChange,
}: Props) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const effectiveBaseServings = baseServings ?? 1;

  // Read from the store, not copied into state: the add-to-list sheet changes it too.
  const savedServings = useAppSelector(selectTargetServings(recipeId));
  const targetServings = savedServings ?? effectiveBaseServings;

  const updateBaseServings = useUpdateBaseServings();

  const handleServingsChange = (value: number) => {
    dispatch(setTargetServingsAction({ recipeId, servings: value }));
  };

  const handleSetDefault = () => {
    updateBaseServings.mutate(
      {
        recipeId,
        baseServings: targetServings,
        previousBaseServings: effectiveBaseServings,
      },
      {
        onSuccess: () => {
          dispatch(clearTargetServings(recipeId));
          toast.success(t("ingredients.defaultUpdated"));
        },
      }
    );
  };

  const { data: scaledIngredients, isLoading } = useScaledIngredients(
    recipeId,
    effectiveBaseServings,
    targetServings
  );

  // Ticked off while cooking; ephemeral, like iOS.
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  function toggleChecked(id: string) {
    setCheckedIds((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  const isScaled = targetServings !== effectiveBaseServings;
  const canScale = showScalingControls && !!baseServings;
  const groupedIngredients = groupIngredients(scaledIngredients);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (scaledIngredients.length === 0) {
    return;
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold">{t("ingredients.title")}</h2>

        {canScale && (
          <ServingScaler value={targetServings} onChange={handleServingsChange} unit={servingsUnit} />
        )}
      </div>

      {canScale && isScaled && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="text-sm font-semibold text-muted-foreground"
            onClick={() => dispatch(clearTargetServings(recipeId))}
          >
            {t("ingredients.reset")}
          </button>

          <Button
            variant="secondary"
            size="sm"
            className="rounded-full"
            onClick={handleSetDefault}
            disabled={updateBaseServings.isPending}
          >
            {updateBaseServings.isPending ? <Loader2 className="animate-spin" /> : t("ingredients.setAsDefault")}
          </Button>
        </div>
      )}

      {groupedIngredients.map((group, groupIndex) => (
        <div key={group.name ?? `group-${groupIndex}`}>
          {group.name && (
            <h3 className="pt-1 text-sm font-semibold text-muted-foreground">{group.name}</h3>
          )}

          <ul>
            {group.ingredients.map((ingredient) => (
              <IngredientRow
                key={ingredient.id}
                ingredient={ingredient}
                baseServings={effectiveBaseServings}
                targetServings={targetServings}
                checked={checkedIds.has(ingredient.id)}
                onToggle={() => toggleChecked(ingredient.id)}
              />
            ))}
          </ul>
        </div>
      ))}

      <ShoppingRecipeAddSheet
        recipeId={recipeId}
        recipeName={recipeName}
        servings={targetServings}
        onServingsChange={handleServingsChange}
        open={addToListOpen}
        onOpenChange={onAddToListOpenChange}
      />
    </section>
  );
}
