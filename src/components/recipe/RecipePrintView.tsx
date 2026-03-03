import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Recipes } from "@/types/exportedDatabaseTypes.types";
import { ScaledIngredient } from "@/types/ingredient.types";
import { groupIngredients } from "@/lib/transformers/ingredient.transformer";
import { QRCodeSVG } from "qrcode.react";
import MarkdownRenderer from "@/components/general/MarkdownRenderer";
import "./recipe-print.css";

type Props = {
  recipe: Recipes;
  imageUrl?: string;
  ingredients: ScaledIngredient[];
  targetServings?: number;
  servingsUnit?: string;
};

export function RecipePrintView({
  recipe,
  imageUrl,
  ingredients,
  targetServings,
  servingsUnit,
}: Props) {
  const { t } = useTranslation();
  const groupedIngredients = groupIngredients(ingredients);
  const deeplink = `https://app.plateful.cloud/recipe/${recipe.id}`;

  return createPortal(
    <div id="recipe-print-view" className="hidden print:block print:pb-[20mm]">
      <div className="text-[#111111] bg-white text-[8pt] leading-[1.4]">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={recipe.name}
            className="w-full aspect-[3/1] object-cover block rounded-[6px]"
            crossOrigin="anonymous"
          />
        )}

        <h1 className="first-font text-[16pt] mt-2.5 mb-0.5">{recipe.name}</h1>

        {targetServings != null && (
          <p className="mb-1 text-[8pt] text-[#666] tracking-[0.03em]">
            {targetServings}{" "}
            {t(`ingredients.units.${servingsUnit ?? "servings"}`, {
              defaultValue: servingsUnit ?? "servings",
            })}
          </p>
        )}

        {recipe.description && (
          <p className="mb-4 text-[8pt] whitespace-pre-wrap">{recipe.description}</p>
        )}

        <div className="grid grid-cols-[1fr_2fr] gap-4 items-start">
          {/* Left column: ingredients */}
          {ingredients.length > 0 && (
            <div>
              <h2 className="second-font text-[10pt] font-bold mb-1">{t("ingredients.title")}</h2>
              {groupedIngredients.map((group, i) => (
                <div key={group.name ?? `g-${i}`}>
                  {group.name && <p className="text-[8pt] font-bold mt-1.5 mb-0.5">{group.name}</p>}

                  <ul className="m-0 list-none">
                    {group.ingredients.map((ing) => (
                      <li key={ing.id} className="mb-px text-[8pt]">
                        {ing.scaledQuantity.display}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Right column: instructions */}
          {recipe.instructions && (
            <div>
              <h2 className="second-font text-[10pt] font-bold mb-1">{t("recipe.instructions")}</h2>

              <MarkdownRenderer content={recipe.instructions} />
            </div>
          )}
        </div>
      </div>

      <div
        id="recipe-print-footer"
        className="hidden print:flex print:flex-row print:justify-between print:items-end print:fixed print:bottom-0 print:left-0 print:right-0 print:bg-white"
      >
        <div>
          <p className="first-font text-[12pt] m-0 leading-none text-[#1b1602]">Plateful</p>
        </div>

        <QRCodeSVG value={deeplink} size={48} />
      </div>
    </div>,
    document.body
  );
}
