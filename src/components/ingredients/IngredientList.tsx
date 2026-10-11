import { useTranslation } from "react-i18next";
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

  const isScaled = targetServings !== effectiveBaseServings;
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
    <div className="">
      {showScalingControls && baseServings && (
        <ServingScaler
          value={targetServings}
          onChange={handleServingsChange}
          unit={servingsUnit}
          showSetDefault={isScaled}
          onSetDefault={handleSetDefault}
          isSettingDefault={updateBaseServings.isPending}
        />
      )}

      <h2 className="text-lg font-semibold mt-4">{t("ingredients.title")}</h2>

      {groupedIngredients.map((group, groupIndex) => (
        <div key={group.name ?? `group-${groupIndex}`}>
          {group.name && <h4 className="font-bold text-sm mt-4">{group.name}</h4>}

          <ul className="list-disc ml-4">
            {group.ingredients.map((ingredient) => (
              <IngredientRow key={ingredient.id} ingredient={ingredient} isScaled={isScaled} />
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
    </div>
  );
}
