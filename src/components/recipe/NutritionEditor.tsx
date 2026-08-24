import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NutritionValues } from "@/api/nutrition.api";

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
  /** Fired on USER edits only (never on seeding) — the parent uses it to
   *  know hand-typed values need a re-estimate if auto is back on at save. */
  onEdited: () => void;
  /** Mirrors `recipes.nutrition_auto`: on = the backend owns the values. */
  auto: boolean;
  onAutoChange: (auto: boolean) => void;
};

/**
 * Editor section for the 7 per-serving nutrition metrics. An "Update
 * automatically" switch mirrors `recipes.nutrition_auto`: while it's on the
 * backend re-estimates the values whenever a save changes the ingredients and
 * the fields are locked; switching it off frees them for manual values that
 * nothing ever overwrites. (This replaced the Calculate button on 2026-08-24 —
 * flipping the switch back on is the re-estimate gesture.)
 *
 * Owns its own field state and reports parsed values up via `onChange`, which
 * the parent folds into the recipe save. It only starts reporting once seeded
 * from a loaded recipe (or a user action), so a save issued before the recipe
 * loads never wipes an existing estimate — the same guard the iOS editor uses.
 */
export default function NutritionEditor({
  initial,
  onChange,
  onEdited,
  auto,
  onAutoChange,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const [drafts, setDrafts] = useState<Drafts>(EMPTY_DRAFTS);
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
    onEdited();
    const next = { ...drafts, [key]: text };
    setDrafts(next);
    onChange(draftsToValues(next));
  }

  return (
    <div className="grid w-full gap-2">
      <div className="flex items-center justify-between">
        <Label>{t("nutrition.title")}</Label>
        <span className="text-xs text-muted-foreground">{t("nutrition.perServing")}</span>
      </div>

      <div className="flex items-center justify-between gap-2 py-1">
        <Label htmlFor="nutrition-auto" className="font-normal">
          {t("nutrition.updateAutomatically")}
        </Label>
        <Switch id="nutrition-auto" checked={auto} onCheckedChange={onAutoChange} />
      </div>

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
              disabled={auto}
            />
          </div>
        ))}
      </div>

      <span className="text-xs text-muted-foreground">
        {auto ? t("nutrition.autoOnHint") : t("nutrition.autoOffHint")}
      </span>
    </div>
  );
}
