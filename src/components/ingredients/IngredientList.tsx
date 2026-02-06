import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useScaledIngredients } from "@/hooks/ingredients/useScaledIngredients";
import { groupIngredients } from "@/lib/transformers/ingredient.transformer";
import { ServingScaler } from "./ServingScaler";
import { IngredientRow } from "./IngredientRow";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  recipeId: string;
  baseServings: number | null;
  servingsUnit?: string;
  showScalingControls?: boolean;
};

export function IngredientList({
  recipeId,
  baseServings,
  servingsUnit = "servings",
  showScalingControls = true,
}: Props) {
  const { t } = useTranslation();
  const effectiveBaseServings = baseServings ?? 1;
  const [targetServings, setTargetServings] = useState(effectiveBaseServings);

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
        <ServingScaler value={targetServings} onChange={setTargetServings} unit={servingsUnit} />
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
    </div>
  );
}
