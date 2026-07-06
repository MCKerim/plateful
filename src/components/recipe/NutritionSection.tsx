import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Flame } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NutritionValues } from "@/api/nutrition.api";

type Props = {
  nutrition: NutritionValues;
};

type MetricDef = {
  key: keyof NutritionValues;
  labelKey: string;
  unit: string;
  /** i18n key for the collapsed single-letter marker; calories uses the flame instead. */
  letterKey?: string;
};

const PRIMARY: MetricDef[] = [
  { key: "calories_kcal", labelKey: "nutrition.calories", unit: "kcal" },
  { key: "carbs_g", labelKey: "nutrition.carbs", unit: "g", letterKey: "nutrition.letters.carbs" },
  { key: "protein_g", labelKey: "nutrition.protein", unit: "g", letterKey: "nutrition.letters.protein" },
  { key: "fat_g", labelKey: "nutrition.fat", unit: "g", letterKey: "nutrition.letters.fat" },
];

const SECONDARY: MetricDef[] = [
  { key: "sugar_g", labelKey: "nutrition.sugar", unit: "g" },
  { key: "fiber_g", labelKey: "nutrition.fiber", unit: "g" },
  { key: "sodium_mg", labelKey: "nutrition.sodium", unit: "mg" },
];

// Thin space between value and unit, like the iOS card ("62 g").
const THIN_SPACE = " ";

/**
 * Recipe-detail nutrition card, mirroring the iOS `NutritionSection`. Collapsed
 * it's a whisper — four bare numbers marked by the flame and a single letter
 * (🔥520 · C 62 · P 18 · F 21), no heading, no units, no chevron. Tapping unfolds
 * it: units appear, each value gets its name underneath, sugar/fiber/sodium slide
 * in, and a small "Nutrition per serving" note anchors the bottom. Hidden
 * entirely when nothing has been calculated.
 */
export default function NutritionSection({ nutrition }: Readonly<Props>) {
  const { t, i18n } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const hasAny = Object.values(nutrition).some((v) => v !== null);
  if (!hasAny) return null;

  const format = (value: number) =>
    value.toLocaleString(i18n.language, { maximumFractionDigits: 1, useGrouping: false });

  const tile = (metric: MetricDef) => {
    const raw = nutrition[metric.key];
    const isCalories = metric.key === "calories_kcal";
    const number = raw === null ? "—" : format(raw);
    const valueText = isExpanded && raw !== null ? `${number}${THIN_SPACE}${metric.unit}` : number;

    return (
      <div key={metric.key} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
        <div className="flex items-center gap-1">
          {isCalories ? (
            <Flame className="size-3.5 text-primary" />
          ) : (
            !isExpanded &&
            metric.letterKey && (
              <span className="text-sm font-bold text-muted-foreground">{t(metric.letterKey)}</span>
            )
          )}
          <span className="text-sm font-semibold tabular-nums">{valueText}</span>
        </div>

        {isExpanded && (
          <span className="text-xs text-muted-foreground truncate max-w-full">
            {t(metric.labelKey)}
          </span>
        )}
      </div>
    );
  };

  return (
    <button
      type="button"
      onClick={() => setIsExpanded((v) => !v)}
      aria-expanded={isExpanded}
      aria-label={t("nutrition.perServingNote")}
      className="w-full mt-2 rounded-3xl border border-border/60 bg-muted/40 backdrop-blur-md shadow-sm px-4 py-3.5 flex flex-col"
    >
      <div className="flex">{PRIMARY.map(tile)}</div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 pt-4">
              <div className="flex">{SECONDARY.map(tile)}</div>
              <p className="text-center text-xs text-muted-foreground">
                {t("nutrition.perServingNote")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
