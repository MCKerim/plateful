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

const s = {
  wrapper: {
    fontFamily: "'Roboto', sans-serif",
    color: "#111111",
    background: "#ffffff",
    fontSize: "9.5pt",
    lineHeight: "1.4",
  } as React.CSSProperties,

  image: {
    width: "100%",
    aspectRatio: "3 / 1",
    objectFit: "cover" as const,
    display: "block",
    borderRadius: "6px",
  } as React.CSSProperties,

  title: {
    fontFamily: "'Shrikhand', serif",
    fontSize: "17pt",
    margin: "10px 0 4px 0",
    lineHeight: "1.1",
    letterSpacing: "-0.3px",
  } as React.CSSProperties,

  meta: {
    margin: "0 0 12px 0",
    fontSize: "8.5pt",
    color: "#666",
    letterSpacing: "0.03em",
  } as React.CSSProperties,

  description: {
    margin: "0 0 16px 0",
    fontSize: "9pt",
  } as React.CSSProperties,

  columns: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: "16px",
    alignItems: "start",
  } as React.CSSProperties,

  sectionHeading: {
    fontSize: "7.5pt",
    fontWeight: "bold",
    margin: "0 0 8px 0",
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    borderLeft: "3px solid #ff9d00",
    paddingLeft: "7px",
  } as React.CSSProperties,

  groupHeading: {
    fontSize: "9pt",
    fontWeight: "bold",
    margin: "6px 0 2px 0",
  } as React.CSSProperties,

  ingredientList: {
    margin: "0",
    paddingLeft: "10px",
    listStyleType: "none",
  } as React.CSSProperties,

  ingredientItem: {
    marginBottom: "1px",
    fontSize: "9pt",
  } as React.CSSProperties,
};

export function RecipePrintView({ recipe, imageUrl, ingredients, targetServings, servingsUnit }: Props) {
  const { t } = useTranslation();
  const groupedIngredients = groupIngredients(ingredients);
  const deeplink = `https://app.plateful.cloud/recipe/${recipe.id}`;

  return createPortal(
    <div id="recipe-print-view">
      <div style={s.wrapper}>
        {imageUrl && (
          <img src={imageUrl} alt={recipe.name} style={s.image} crossOrigin="anonymous" />
        )}

        <h1 style={s.title}>{recipe.name}</h1>

        {targetServings != null && (
          <p style={s.meta}>
            {targetServings} {t(`ingredients.units.${servingsUnit ?? "servings"}`, { defaultValue: servingsUnit ?? "servings" })}
          </p>
        )}

        {recipe.description && (
          <p style={{ ...s.description, whiteSpace: "pre-wrap" }}>{recipe.description}</p>
        )}

        <div style={s.columns}>
          {/* Left column: ingredients */}
          {ingredients.length > 0 && (
            <div>
              <h2 style={s.sectionHeading}>{t("ingredients.title")}</h2>
              {groupedIngredients.map((group, i) => (
                <div key={group.name ?? `g-${i}`}>
                  {group.name && <p style={s.groupHeading}>{group.name}</p>}
                  <ul style={s.ingredientList}>
                    {group.ingredients.map((ing) => (
                      <li key={ing.id} style={s.ingredientItem}>
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
              <h2 style={s.sectionHeading}>{t("recipe.instructions")}</h2>
              <MarkdownRenderer content={recipe.instructions} />
            </div>
          )}
        </div>
      </div>

      <div id="recipe-print-footer">
        <div>
          <p style={{ fontFamily: "'Shrikhand', serif", fontSize: "10pt", margin: "0", lineHeight: "1", color: "#1b1602" }}>
            Plateful
          </p>
          <p style={{ fontSize: "7pt", margin: "2px 0 0 0", color: "#888", letterSpacing: "0.02em" }}>
            app.plateful.cloud
          </p>
        </div>
        <QRCodeSVG value={deeplink} size={36} />
      </div>
    </div>,
    document.body
  );
}
