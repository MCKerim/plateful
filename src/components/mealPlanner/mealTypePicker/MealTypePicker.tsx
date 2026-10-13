import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { useTranslation } from "react-i18next";
import { MEAL_TYPES } from "@/lib/mealPlanHelper/mealPlanHelper";
import { MealType } from "@/types/meal-planning.types";
import { MEAL_TYPE_ICONS } from "../mealTypeIcons";

/**
 * The four meal types side by side, one always selected: the weekly plan
 * dialog's control and the "Meal type" row in a planner entry's menu.
 */
export default function MealTypePicker({
  value,
  onChange,
}: Readonly<{ value: MealType; onChange: (mealType: MealType) => void }>) {
  const { t } = useTranslation();

  return (
    <RadioGroupPrimitive.Root
      value={value}
      onValueChange={(next) => onChange(next as MealType)}
      orientation="horizontal"
      aria-label={t("mealType.label")}
      className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1"
    >
      {MEAL_TYPES.map((type) => {
        const Icon = MEAL_TYPE_ICONS[type];
        return (
          <RadioGroupPrimitive.Item
            key={type}
            value={type}
            className="flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-xs font-semibold text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
          >
            <Icon size={20} aria-hidden />
            <span className="w-full truncate text-center">{t(`mealType.${type}`)}</span>
          </RadioGroupPrimitive.Item>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
}
