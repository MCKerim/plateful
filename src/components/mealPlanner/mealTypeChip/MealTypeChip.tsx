import { Cookie, Sun, Sunrise, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MealType } from "@/types/meal-planning.types";

const ICONS: Record<Exclude<MealType, "dinner">, LucideIcon> = {
  breakfast: Sunrise,
  lunch: Sun,
  snack: Cookie,
};

/** An entry's meal type above its title. Dinner, the plan's usual meal, shows nothing. */
export default function MealTypeChip({ mealType }: Readonly<{ mealType: MealType }>) {
  const { t } = useTranslation();
  if (mealType === "dinner") return null;
  const Icon = ICONS[mealType];

  return (
    <span className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground">
      <Icon size={12} aria-hidden />
      {t(`mealType.${mealType}`)}
    </span>
  );
}
