import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NutritionValues, NutritionEstimateInput } from "@/api/nutrition.api";
import { useEstimateNutrition } from "@/hooks/recipe/useEstimateNutrition";

type FieldKey = keyof NutritionValues;

type Field = {
  key: FieldKey;
  labelKey: string;
  unit: string;
  decimals: 0 | 1;
};

const FIELDS: Field[] = [
  { key: "calories_kcal", labelKey: "nutrition.calories", unit: "kcal", decimals: 0 },
  { key: "protein_g", labelKey: "nutrition.protein", unit: "g", decimals: 1 },
  { key: "carbs_g", labelKey: "nutrition.carbs", unit: "g", decimals: 1 },
  { key: "fat_g", labelKey: "nutrition.fat", unit: "g", decimals: 1 },
  { key: "sugar_g", labelKey: "nutrition.sugar", unit: "g", decimals: 1 },
  { key: "fiber_g", labelKey: "nutrition.fiber", unit: "g", decimals: 1 },
  { key: "sodium_mg", labelKey: "nutrition.sodium", unit: "mg", decimals: 0 },
];

type Drafts = Record<FieldKey, string>;

const EMPTY_DRAFTS: Drafts = {
  calories_kcal: "",
  carbs_g: "",
  protein_g: "",
  fat_g: "",
  sugar_g: "",
  fiber_g: "",
  sodium_mg: "",
};

/** Parse a user-typed value; accepts comma decimals. Empty/invalid/negative → null. */
function parseDraft(text: string): number | null {
  const trimmed = text.trim().replace(",", ".");
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function draftsToValues(drafts: Drafts): NutritionValues {
  return {
    calories_kcal: parseDraft(drafts.calories_kcal),
    carbs_g: parseDraft(drafts.carbs_g),
    protein_g: parseDraft(drafts.protein_g),
    fat_g: parseDraft(drafts.fat_g),
    sugar_g: parseDraft(drafts.sugar_g),
    fiber_g: parseDraft(drafts.fiber_g),
    sodium_mg: parseDraft(drafts.sodium_mg),
  };
}

function valueToDraft(value: number | null, decimals: 0 | 1): string {
  if (value === null) return "";
  return decimals === 0 ? Math.round(value).toString() : String(Number(value.toFixed(1)));
}

function valuesToDrafts(values: NutritionValues): Drafts {
  const drafts = { ...EMPTY_DRAFTS };
  for (const field of FIELDS) {
    drafts[field.key] = valueToDraft(values[field.key], field.decimals);
  }
  return drafts;
}

type Props = {
  /** The loaded recipe's nutrition (edit mode), or null until it loads / when adding. */
  initial: NutritionValues | null;
  onChange: (values: NutritionValues) => void;
  /** Context for the "Calculate" estimate — current editor contents. */
  title: string;
  servings: number | null;
  ingredientLines: string[];
};

/**
 * Editor section for the 7 per-serving nutrition metrics: a Calculate button
 * (AI estimate from the extractor) plus manually editable fields. Owns its own
 * field state and reports parsed values up via `onChange`, which the parent
 * folds into the recipe save. It only starts reporting once seeded from a
 * loaded recipe (or a user action), so a save issued before the recipe loads
 * never wipes an existing estimate — the same guard the iOS editor uses.
 */
export default function NutritionEditor({
  initial,
  onChange,
  title,
  servings,
  ingredientLines,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const [drafts, setDrafts] = useState<Drafts>(EMPTY_DRAFTS);
  const estimate = useEstimateNutrition();
  const seeded = useRef(false);

  // Seed once from the loaded recipe (edit mode). Reporting the seeded values up
  // marks nutrition as "loaded" for the parent's save gate.
  useEffect(() => {
    if (seeded.current || !initial) return;
    seeded.current = true;
    setDrafts(valuesToDrafts(initial));
    onChange(initial);
  }, [initial, onChange]);

  function updateField(key: FieldKey, text: string) {
    seeded.current = true;
    const next = { ...drafts, [key]: text };
    setDrafts(next);
    onChange(draftsToValues(next));
  }

  function handleCalculate() {
    if (!title.trim()) {
      toast.error(t("nutrition.errors.titleRequired"));
      return;
    }
    if (ingredientLines.length === 0) {
      toast.error(t("nutrition.errors.ingredientsRequired"));
      return;
    }

    const input: NutritionEstimateInput = {
      title: title.trim(),
      servings,
      ingredients: ingredientLines,
    };

    estimate.mutate(input, {
      onSuccess: (values) => {
        seeded.current = true;
        setDrafts(valuesToDrafts(values));
        onChange(values);
      },
      onError: () => {
        toast.error(t("nutrition.errors.calculateFailed"));
      },
    });
  }

  const hasValues = FIELDS.some((f) => drafts[f.key].trim() !== "");

  return (
    <div className="grid w-full gap-2">
      <div className="flex items-center justify-between">
        <Label>{t("nutrition.title")}</Label>
        <span className="text-xs text-muted-foreground">{t("nutrition.perServing")}</span>
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={handleCalculate}
        disabled={estimate.isPending}
      >
        {estimate.isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Sparkles />
        )}
        {estimate.isPending
          ? t("nutrition.calculating")
          : hasValues
            ? t("nutrition.recalculate")
            : t("nutrition.calculate")}
      </Button>

      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map((field) => (
          <div key={field.key} className="grid gap-1">
            <Label htmlFor={`nutrition-${field.key}`} className="text-xs text-muted-foreground">
              {t(field.labelKey)} ({field.unit})
            </Label>
            <Input
              id={`nutrition-${field.key}`}
              type="text"
              inputMode="decimal"
              placeholder="—"
              value={drafts[field.key]}
              onChange={(e) => updateField(field.key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
