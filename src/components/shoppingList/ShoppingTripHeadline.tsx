import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import type { TripRecipe } from "@/lib/shopping-list/list";
import RecipeCover from "@/components/shoppingList/RecipeCover";

type Props = {
  openCount: number;
  tripRecipes: TripRecipe[];
  /** The covers' public URLs by recipe id; a recipe missing here was deleted. */
  coverUrls: Map<string, string | null>;
  onOpenRecipes: () => void;
};

/** The translations' `**bold**` as the accent, the way the native headline styles them. */
function accented(text: string) {
  return text.split("**").map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="text-accent">
        {part}
      </strong>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    )
  );
}

/**
 * What the trip is, as one sentence: "**12 things** to buy, [covers] **2
 * recipes** included". The recipes phrase always starts its own line and is one
 * button with its covers; nothing left reads "everything bought".
 */
export default function ShoppingTripHeadline({
  openCount,
  tripRecipes,
  coverUrls,
  onOpenRecipes,
}: Readonly<Props>) {
  const { t } = useTranslation();

  if (openCount === 0) {
    return (
      <h2 className="text-3xl font-bold leading-tight">
        {t("shoppingList.headline.done")
          .split("\n")
          .map((line) => (
            <span key={line} className="block">
              {accented(line)}
            </span>
          ))}
      </h2>
    );
  }

  if (tripRecipes.length === 0) {
    return (
      <h2 className="text-3xl font-bold leading-tight">
        {accented(t("shoppingList.headline.count", { count: openCount }))}
      </h2>
    );
  }

  const [before, ...after] = t("shoppingList.headline.withRecipes", { count: openCount }).split(
    "{recipes}"
  );
  const covers = tripRecipes.slice(0, 3);

  return (
    <h2 className="text-3xl font-bold leading-tight">
      <span className="block">{accented(before.trimEnd())}</span>
      <button
        type="button"
        onClick={onOpenRecipes}
        className="inline-flex items-baseline gap-2 text-left align-baseline"
        aria-label={t("shoppingList.headline.showRecipes")}
      >
        <span
          className="relative inline-block h-8 shrink-0 self-center"
          style={{ width: 32 + (covers.length - 1) * 18 }}
          aria-hidden
        >
          {covers.map((recipe, index) => (
            <span
              key={recipe.id}
              className="absolute top-0 size-8 overflow-hidden rounded-[9px] border-[1.5px] border-background bg-background"
              style={{
                left: index * 18,
                zIndex: covers.length - index,
                transform: `rotate(${covers.length > 1 ? (index - (covers.length - 1) / 2) * 9 : -6}deg)`,
              }}
            >
              <RecipeCover url={coverUrls.get(recipe.id)} exists={coverUrls.has(recipe.id)} />
            </span>
          ))}
        </span>
        <span>{accented(t("shoppingList.headline.recipes", { count: tripRecipes.length }))}</span>
      </button>
      {accented(after.join(""))}
    </h2>
  );
}
