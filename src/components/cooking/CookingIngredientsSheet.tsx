import { Circle, CircleCheck } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { ServingScaler } from "@/components/ingredients/ServingScaler";
import { groupIngredients } from "@/lib/transformers/ingredient.transformer";
import { cn } from "@/lib/utils";
import type { ScaledIngredient } from "@/types/ingredient.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredients: ScaledIngredient[];
  isScaled: boolean;
  servings: number;
  servingsUnit: string;
  onServingsChange: (servings: number) => void;
  /** The shared mise en place: checked for every cook of the pot. */
  checked: ReadonlySet<string>;
  onToggle: (ingredientId: string) => void;
};

/** The ingredient list over the cooking screen: a servings stepper and check-off rows, grouped as in the recipe. */
export default function CookingIngredientsSheet({
  open,
  onOpenChange,
  ingredients,
  isScaled,
  servings,
  servingsUnit,
  onServingsChange,
  checked,
  onToggle,
}: Readonly<Props>) {
  const groups = groupIngredients(ingredients);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="max-h-[75vh] overflow-y-auto px-4 pb-10 pt-4">
          <div className="mb-4 flex justify-center">
            <ServingScaler value={servings} onChange={onServingsChange} unit={servingsUnit} />
          </div>

          {groups.map((group) => (
            <div key={group.name ?? ""} className="mb-3">
              {group.name && <p className="mb-1 text-sm font-semibold text-muted-foreground">{group.name}</p>}
              <ul>
                {group.ingredients.map((ingredient) => {
                  const isChecked = checked.has(ingredient.id);
                  return (
                    <li key={ingredient.id}>
                      <button
                        type="button"
                        onClick={() => onToggle(ingredient.id)}
                        className={cn(
                          "flex w-full items-start gap-3 py-2 text-left",
                          isChecked && "opacity-60"
                        )}
                        aria-pressed={isChecked}
                      >
                        {isChecked ? (
                          <CircleCheck className="mt-0.5 size-5 shrink-0 text-accent" />
                        ) : (
                          <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                        )}
                        <span className={cn("font-medium", isChecked && "line-through")}>
                          {isScaled ? ingredient.scaledQuantity.display : ingredient.rawText}
                          {ingredient.isOptional && (
                            <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
