import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Recipes } from "@/types/exportedDatabaseTypes.types";
import { ScaledIngredient } from "@/types/ingredient.types";
import { groupIngredients } from "@/lib/transformers/ingredient.transformer";
import { QRCodeSVG } from "qrcode.react";
import ReactMarkdown from "react-markdown";
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
    fontFamily: "'Georgia', 'Times New Roman', serif",
    color: "#111111",
    background: "#ffffff",
    fontSize: "9.5pt",
    lineHeight: "1.4",
    padding: "0",
  } as React.CSSProperties,

  header: {
    borderBottom: "2px solid #111111",
    paddingBottom: "6px",
    marginBottom: "10px",
  } as React.CSSProperties,

  title: {
    fontFamily: "'Georgia', serif",
    fontSize: "18pt",
    fontWeight: "bold",
    margin: "0",
  } as React.CSSProperties,

  image: {
    width: "100%",
    maxHeight: "160px",
    objectFit: "cover" as const,
    display: "block",
    marginBottom: "10px",
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
    borderBottom: "1px solid #cccccc",
    paddingBottom: "2px",
  } as React.CSSProperties,

  groupHeading: {
    fontSize: "9pt",
    fontWeight: "bold",
    margin: "6px 0 2px 0",
    fontStyle: "italic",
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

  instructions: {
    margin: "0",
    fontSize: "9pt",
    whiteSpace: "pre-wrap" as const,
  } as React.CSSProperties,

  qrRow: {
    display: "flex",
    flexDirection: "row" as const,
    gap: "20px",
    marginTop: "12px",
    paddingTop: "10px",
    borderTop: "1px solid #cccccc",
  } as React.CSSProperties,

  qrItem: {
    display: "flex",
    flexDirection: "row" as const,
    alignItems: "center",
    gap: "8px",
  } as React.CSSProperties,

  qrLabel: {
    fontSize: "8pt",
    fontWeight: "bold",
    color: "#333333",
    margin: "0 0 2px 0",
  } as React.CSSProperties,
};

export function RecipePrintView({ recipe, imageUrl, ingredients, targetServings, servingsUnit }: Props) {
  const { t } = useTranslation();
  const groupedIngredients = groupIngredients(ingredients);
  const deeplink = `https://app.plateful.cloud/recipe/${recipe.id}`;

  return createPortal(
    <div id="recipe-print-view">
      <div style={s.wrapper}>

        <div style={s.header}>
          <h1 style={s.title}>{recipe.name}</h1>
        </div>

        {imageUrl && (
          <img src={imageUrl} alt={recipe.name} style={s.image} crossOrigin="anonymous" />
        )}

        {recipe.description && (
          <div style={s.description}>
            <ReactMarkdown
              components={{
                p: ({ children }) => <p style={{ margin: "0 0 4px 0" }}>{children}</p>,
                ul: ({ children }) => <ul style={{ paddingLeft: "16px", margin: "0 0 4px 0" }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ paddingLeft: "16px", margin: "0 0 4px 0" }}>{children}</ol>,
                li: ({ children }) => <li style={{ marginBottom: "1px" }}>{children}</li>,
                strong: ({ children }) => <strong style={{ fontWeight: "bold" }}>{children}</strong>,
                em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
                h1: ({ children }) => <h3 style={{ fontSize: "10pt", fontWeight: "bold", margin: "4px 0 2px" }}>{children}</h3>,
                h2: ({ children }) => <h3 style={{ fontSize: "10pt", fontWeight: "bold", margin: "4px 0 2px" }}>{children}</h3>,
                h3: ({ children }) => <h3 style={{ fontSize: "9.5pt", fontWeight: "bold", margin: "4px 0 2px" }}>{children}</h3>,
              }}
            >
              {recipe.description}
            </ReactMarkdown>
          </div>
        )}

        <div style={s.columns}>
          {/* Left column: ingredients */}
          {ingredients.length > 0 && (
            <div>
              <h2 style={s.sectionHeading}>
                {t("ingredients.title")}
                {targetServings != null && (
                  <span style={{ fontWeight: "normal", fontSize: "8pt", marginLeft: "6px", color: "#555" }}>
                    ({targetServings} {servingsUnit ?? t("ingredients.servings")})
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
              <p style={s.instructions}>{recipe.instructions}</p>
            </div>
          )}
        </div>

        <div style={s.qrRow}>
          <div style={s.qrItem}>
            <QRCodeSVG value={deeplink} size={52} />
            <p style={s.qrLabel}>{t("recipe.printQrLabel")}</p>
          </div>
          {recipe.link && (
            <div style={s.qrItem}>
              <QRCodeSVG value={recipe.link} size={52} />
              <p style={s.qrLabel}>{t("recipe.printSourceLabel")}</p>
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
