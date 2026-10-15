import { useTranslation } from "react-i18next";
import { MealType } from "@/types/meal-planning.types";
import { MEAL_TYPE_ICONS } from "../mealTypeIcons";

/** A planned recipe's meal type below its title, as on iOS. Dinner, the plan's usual meal, shows nothing. */
export default function MealTypeChip({ mealType }: Readonly<{ mealType: MealType }>) {
  const { t } = useTranslation();
  if (mealType === "dinner") return null;
  const Icon = MEAL_TYPE_ICONS[mealType];

  return (
    <span className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground">
      <Icon size={12} aria-hidden />
      {t(`mealType.${mealType}`)}
    </span>
  );
}
