import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getScaledQuantityDisplay } from "@/lib/ingredient-parser/scale-ingredients";
import type { ScaledIngredient } from "@/types/ingredient.types";

type Props = {
  ingredient: ScaledIngredient;
  baseServings: number;
  targetServings: number;
  /** Without it the row is read-only (a shared recipe that isn't the household's yet). */
  onToggle?: () => void;
  checked?: boolean;
};

/**
 * One ingredient line, checkable while cooking like the native app's: the
 * mark, the scaled amount column, the name with its preparation note, and
 * the optional badge.
 */
export function IngredientRow({ ingredient, baseServings, targetServings, onToggle, checked = false }: Props) {
  const quantity = getScaledQuantityDisplay(ingredient, baseServings, targetServings);
  const amount = [quantity, ingredient.unit].filter(Boolean).join(" ");
  const rowClass = "flex w-full items-baseline gap-3 py-1 text-left text-base";

  const content = (
    <>
      {onToggle && (
        <span
          className={cn(
            "flex size-[22px] shrink-0 translate-y-1 items-center justify-center self-start rounded-full border-2",
            checked ? "border-accent bg-accent text-accent-foreground" : "border-muted-foreground/60"
          )}
        >
          {checked && <Check className="size-3.5" strokeWidth={3} />}
        </span>
      )}

      <span className="min-w-16 font-semibold tabular-nums">{amount}</span>

      <span className="flex-1">
        {ingredient.name || ingredient.rawText}
        {ingredient.preparationNote && (
          <span className="block text-xs text-muted-foreground">{ingredient.preparationNote}</span>
        )}
      </span>

      {ingredient.isOptional && (
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground no-underline">
          optional
        </span>
      )}
    </>
  );

  return (
    <li>
      {onToggle ? (
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          onClick={onToggle}
          className={cn(rowClass, "transition-opacity", checked && "text-muted-foreground line-through opacity-60")}
        >
          {content}
        </button>
      ) : (
        <div className={rowClass}>{content}</div>
      )}
    </li>
  );
}
