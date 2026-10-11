import { startOfDay } from "date-fns";
import type { IngredientsBundle, RecipeIngredient } from "@/types/ingredient.types";
import type { MealPlannerItem } from "@/types/meal-planning.types";
import { AISLES } from "@/lib/shopping-list/aisle";
import {
  addTypedAmount,
  hasAmount,
  itemFromLine,
  nameKey,
  type Amount,
  type ShoppingListItem,
} from "@/lib/shopping-list/item";
import type { ChecklistIndex } from "@/lib/shopping-list/list";
import { bySortOrder } from "@/lib/transformers/ingredient.transformer";

/**
 * One placement the planner's add-to-list sheet offers, a row under its day
 * like the planner's own: a recipe planned on two days is two rows.
 */
export type PlanMeal = {
  /** The placement's id. */
  id: string;
  recipeId: string;
  recipeName: string;
  /** The day it is planned for; null in the pool. */
  day: Date | null;
  /**
   * A later placement of a recipe the range already holds: off by default,
   * since two days of one dish are usually leftovers, and on when it really is
   * cooked twice, which then shops for both.
   */
  isRepeat: boolean;
};

/** One day of the sheet's meal list; the pool (`day` null) first, as in the planner. */
export type PlanDay = { day: Date | null; meals: PlanMeal[] };

/** A selected recipe's rows at the servings chosen for it: one per recipe, the scales summed. */
export type PlanPortion = { recipeId: string; ingredients: RecipeIngredient[]; scale: number };

/** One ingredient row the add sends, at its recipe's scale. */
export type RecipeLine = { ingredientId: string; scale: number };

/** A checklist line: a product as the add will put it on the list, the selected recipes' rows merged. */
export type PlanLine = {
  /** The identity the rows merged on: `slug:<slug>`, else `name:<key>`. */
  id: string;
  /** The name, slug, aisle and summed amount the list will show. */
  item: ShoppingListItem;
  isStaple: boolean;
  /** The rows behind it: what the add sends. */
  ingredients: RecipeLine[];
  /** The recipes it comes from, in the order their rows came. */
  recipeIds: string[];
};

/**
 * The uncooked recipe placements of the shown week (`weekDays`): this week from
 * today, a later week whole, a past one nothing, with the uncooked pool first.
 * Day by day in the plan's order; a recipe's second placement is a repeat, the
 * dated ones counted before the pool so the day you cook wins over a pool copy.
 * Notes are no meals.
 */
export function planMeals(planned: MealPlannerItem[], weekDays: Date[], now: Date): PlanMeal[] {
  const weekStart = startOfDay(weekDays[0]).getTime();
  const weekEnd = startOfDay(weekDays[weekDays.length - 1]).getTime();
  const start = Math.max(weekStart, startOfDay(now).getTime());
  if (weekEnd < start) return [];

  const uncooked = planned.filter((item) => item.kind === "recipe" && !item.eaten);
  const dated = uncooked
    .map((meal, offset) => ({
      meal,
      offset,
      day: meal.planned_date && startOfDay(meal.planned_date).getTime(),
    }))
    .filter(({ day }) => day !== null && day >= start && day <= weekEnd)
    .sort((a, b) => (a.day ?? 0) - (b.day ?? 0) || a.offset - b.offset)
    .map(({ meal }) => meal);
  const pool = uncooked.filter((meal) => meal.planned_date === null);

  const seen = new Set<string>();
  const row = (meal: MealPlannerItem): PlanMeal => {
    if (meal.kind !== "recipe") throw new Error("a note is no meal");
    const isRepeat = seen.has(meal.recipeId);
    seen.add(meal.recipeId);
    return {
      id: meal.id,
      recipeId: meal.recipeId,
      recipeName: meal.recipeName,
      day: meal.planned_date && startOfDay(meal.planned_date),
      isRepeat,
    };
  };
  const datedRows = dated.map(row);
  return [...pool.map(row), ...datedRows];
}

/** `planMeals` under day headers, in their order, the pool first. */
export function planDays(meals: PlanMeal[]): PlanDay[] {
  const days: PlanDay[] = [];
  for (const meal of meals) {
    const time = meal.day?.getTime() ?? null;
    const day = days.find((candidate) => (candidate.day?.getTime() ?? null) === time);
    if (day) day.meals.push(meal);
    else days.push({ day: meal.day, meals: [meal] });
  }
  return days;
}

/** On unless a repeat or a recipe already on the list (one without rows the sheet turns off). */
export function isSelectedByDefault(meal: PlanMeal, onList: Set<string>): boolean {
  return !meal.isRepeat && !onList.has(meal.recipeId);
}

/**
 * A scaled amount at shopping precision, the server's
 * `private.shopping_round_scaled`: whole from 10 up, one decimal from 1 up,
 * else two (583.33 g is 583 g, 1.666 tsp 1.7 tsp). Rounded half away from
 * zero on the value's shortest spelling, the way the server's `numeric` goes
 * (0.285 is 0.29, not the binary 0.28499… rounded down).
 */
export function roundScaled(value: number): number {
  const magnitude = Math.abs(value);
  const places = magnitude >= 10 ? 0 : magnitude >= 1 ? 1 : 2;
  const shifted = Math.round(Number(`${magnitude}e${places}`));
  const rounded = Number(`${shifted}e-${places}`);
  if (Number.isNaN(rounded)) return value;
  return Math.sign(value) * rounded;
}

/** The ingredient's name as the list takes it; the raw line when the parser split none out. */
export function displayName(ingredient: RecipeIngredient): string {
  return ingredient.name?.trim() || ingredient.rawText.trim();
}

/**
 * The amount the list gets for this row at `scale`, the way
 * `add_ingredients_to_shopping_list` works it out: unscaled, the row as
 * written; else a scalable value multiplied and rounded to shopping precision
 * with the written display dropped (a range "2-3" lands as its midpoint, "5"
 * at twice), a line without a value keeping its text. The unit trimmed, none
 * when empty.
 */
export function listAmount(ingredient: RecipeIngredient, scale: number): Amount {
  const unit = ingredient.unit?.trim() || null;
  const { value, display } = ingredient.quantity;
  if (scale === 1) return { quantityValue: value, quantityDisplay: display, unit };
  return {
    quantityValue: ingredient.isScalable && value !== null ? roundScaled(value * scale) : value,
    quantityDisplay: value === null ? display : null,
    unit,
  };
}

/** A serving count changes anything only with a declared base and a row that scales. */
export function canScale(base: number | null, ingredients: RecipeIngredient[]): boolean {
  return (base ?? 0) > 0 && ingredients.some((ingredient) => ingredient.isScalable);
}

/** The factor `servings` puts on rows written for `base` servings; 1 when nothing can scale. */
export function servingsScale(
  servings: number,
  base: number | null,
  ingredients: RecipeIngredient[]
): number {
  if (base === null || !canScale(base, ingredients)) return 1;
  return Math.max(servings, 1) / base;
}

/**
 * The selected placements' rows at their serving counts, one portion per
 * recipe: a recipe cooked twice adds its scales up, since the server takes each
 * ingredient row once; a recipe that can't scale stays as written however often
 * it is cooked. Placements whose rows aren't loaded are left out.
 */
export function planPortions(
  meals: PlanMeal[],
  servings: (meal: PlanMeal) => number,
  bundles: Map<string, IngredientsBundle>
): PlanPortion[] {
  const portions: PlanPortion[] = [];
  for (const meal of meals) {
    const bundle = bundles.get(meal.recipeId);
    if (!bundle) continue;
    const scale = servingsScale(servings(meal), bundle.baseServings, bundle.ingredients);
    const portion = portions.find((candidate) => candidate.recipeId === meal.recipeId);
    if (!portion) {
      portions.push({ recipeId: meal.recipeId, ingredients: bundle.ingredients, scale });
    } else if (canScale(bundle.baseServings, bundle.ingredients)) {
      portion.scale += scale;
    }
  }
  return portions;
}

/** The identity a staple's line merges on: what starts deselected. */
export function lineId(slug: string): string {
  return `slug:${slug}`;
}

const AISLE_ORDER = new Map<string, number>(AISLES.map(({ id }, index) => [id, index]));

/**
 * The checklist for these portions: one line per product, store-walk order,
 * staples last. Mirrors the server's add: rows in its order (sort order, then
 * id, across recipes), each scaled its recipe's way, identity by slug else
 * name, the same unit summed, a different one kept as text ("500 g + 2 EL"),
 * a line without an amount adding nothing.
 */
export function planLines(portions: PlanPortion[], index: ChecklistIndex): PlanLine[] {
  const rows = portions
    .flatMap(({ recipeId, ingredients, scale }) =>
      ingredients.map((ingredient) => ({ ingredient, recipeId, scale }))
    )
    .sort((a, b) => bySortOrder(a.ingredient, b.ingredient));
  const lines: PlanLine[] = [];
  for (const { ingredient, recipeId, scale } of rows) {
    const name = displayName(ingredient);
    if (!name) continue;
    const slug = ingredient.ingredientSlug;
    const amount = listAmount(ingredient, scale);
    const sent = { ingredientId: ingredient.id, scale };
    const key = nameKey(name);
    const existing =
      (slug !== null && lines.find((line) => line.item.ingredientSlug === slug)) ||
      lines.find((line) => nameKey(line.item.name) === key);
    if (existing) {
      existing.ingredients.push(sent);
      if (!existing.recipeIds.includes(recipeId)) existing.recipeIds.push(recipeId);
      if (existing.item.ingredientSlug === null) existing.item.ingredientSlug = slug;
      if (hasAmount(amount)) existing.item = addTypedAmount(existing.item, amount, false);
    } else {
      const id = slug !== null ? lineId(slug) : `name:${key}`;
      lines.push({
        id,
        item: itemFromLine({ ...amount, name }, { id, slug, aisle: index.aisle(slug), now: 0 }),
        isStaple: index.isStaple(slug),
        ingredients: [sent],
        recipeIds: [recipeId],
      });
    }
  }
  const rank = (line: PlanLine) => [line.isStaple ? 1 : 0, AISLE_ORDER.get(line.item.aisle) ?? 0];
  return lines.sort((a, b) => {
    const [aStaple, aAisle] = rank(a);
    const [bStaple, bAisle] = rank(b);
    return aStaple - bStaple || aAisle - bAisle;
  });
}
