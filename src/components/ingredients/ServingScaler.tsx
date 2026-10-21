import { Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange: (servings: number) => void;
  unit?: string;
  /** The count alone, for a row that has its own context (the week's add-to-list sheet). */
  compact?: boolean;
};

/** The serving count as a stepper in a capsule — minus, "4 servings", plus — like the native `ServingsPill`. */
export function ServingScaler({ value, onChange, unit = "servings", compact = false }: Props) {
  const { t } = useTranslation();
  const label = `${value} ${t(`ingredients.units.${unit}`, { defaultValue: unit })}`;

  return (
    <div
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-full text-sm font-semibold",
        compact ? "gap-2 bg-muted px-2 py-1.5" : "gap-3.5 bg-secondary px-3.5 py-2"
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label={t("ingredients.fewerServings")}
        className="flex size-6 items-center justify-center disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>

      <span className="whitespace-nowrap tabular-nums" aria-label={label}>
        {compact ? value : label}
      </span>

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label={t("ingredients.moreServings")}
        className="flex size-6 items-center justify-center"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
