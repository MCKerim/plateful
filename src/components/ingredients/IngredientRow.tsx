import { cn } from "@/lib/utils";
import type { ScaledIngredient } from "@/types/ingredient.types";

type Props = {
  ingredient: ScaledIngredient;
  isScaled?: boolean;
};

export function IngredientRow({ ingredient, isScaled = false }: Props) {
  const displayText = isScaled
    ? ingredient.scaledQuantity.display
    : ingredient.rawText;

  return (
    <li
      className={cn(
        "py-1.5 border-b border-border last:border-b-0",
        ingredient.isOptional && "text-muted-foreground",
        !ingredient.isScalable && isScaled && "opacity-75"
      )}
    >
      <span className="text-sm">
        {displayText}
        {ingredient.isOptional && (
          <span className="text-xs ml-1 text-muted-foreground">(optional)</span>
        )}
      </span>
    </li>
  );
}
