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
    padding: "0",
  } as React.CSSProperties,

  topBar: {
    display: "flex",
    flexDirection: "row" as const,
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  } as React.CSSProperties,

  brandingText: {
    fontFamily: "'Shrikhand', serif",
    fontSize: "11pt",
    color: "#111111",
    margin: "0",
    lineHeight: "1",
  } as React.CSSProperties,

  image: {
    width: "100%",
    maxHeight: "160px",
    objectFit: "cover" as const,
    display: "block",
    borderRadius: "6px",
  } as React.CSSProperties,

  title: {
    fontFamily: "'Shrikhand', serif",
    fontSize: "20pt",
    margin: "8px 0 6px 0",
    lineHeight: "1.1",
  } as React.CSSProperties,

  description: {
    margin: "0 0 8px 0",
    fontSize: "9pt",
  } as React.CSSProperties,

  columns: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: "16px",
    alignItems: "start",
  } as React.CSSProperties,

  sectionHeading: {
    fontSize: "10.5pt",
    fontWeight: "bold",
    margin: "0 0 4px 0",
  } as React.CSSProperties,

  groupHeading: {
    fontSize: "9pt",
    fontWeight: "bold",
    margin: "6px 0 2px 0",
  } as React.CSSProperties,

  ingredientList: {
    margin: "0",
    paddingLeft: "14px",
    listStyleType: "disc",
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

        <div style={s.topBar}>
          <p style={s.brandingText}>Plateful</p>
          <QRCodeSVG value={deeplink} size={40} />
        </div>

        {imageUrl && (
          <img src={imageUrl} alt={recipe.name} style={s.image} crossOrigin="anonymous" />
        )}

        <h1 style={s.title}>{recipe.name}</h1>

        {recipe.description && (
          <p style={{ ...s.description, whiteSpace: "pre-wrap" }}>{recipe.description}</p>
        )}

        <div style={s.columns}>
          {/* Left column: ingredients */}
          {ingredients.length > 0 && (
            <div>
              <h2 style={s.sectionHeading}>
                {t("ingredients.title")}
                {targetServings != null && (
                  <span style={{ fontWeight: "normal", fontSize: "8pt", marginLeft: "6px", color: "#555" }}>
                    ({targetServings} {t(`ingredients.units.${servingsUnit ?? "servings"}`, { defaultValue: servingsUnit ?? "servings" })})
                  </span>
                )}
              </h2>
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
    </div>,
    document.body
  );
}
