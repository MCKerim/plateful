import { Recipes } from "@/types/exportedDatabaseTypes.types";
import { RecipeIngredient } from "@/types/ingredient.types";
import { groupIngredients } from "@/lib/transformers/ingredient.transformer";
import { QRCodeSVG } from "qrcode.react";
import "./recipe-print.css";

type Props = {
  recipe: Recipes;
  imageUrl?: string;
  ingredients: RecipeIngredient[];
};

const s = {
  wrapper: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    color: "#111111",
    background: "#ffffff",
    maxWidth: "180mm",
    margin: "0 auto",
    fontSize: "11pt",
    lineHeight: "1.5",
  } as React.CSSProperties,
  header: {
    borderBottom: "2px solid #111111",
    paddingBottom: "8px",
    marginBottom: "16px",
  } as React.CSSProperties,
  title: {
    fontFamily: "'Georgia', serif",
    fontSize: "22pt",
    fontWeight: "bold",
    margin: "0 0 4px 0",
  } as React.CSSProperties,
  sourceLink: {
    fontSize: "8pt",
    color: "#555555",
    wordBreak: "break-all" as const,
  } as React.CSSProperties,
  image: {
    width: "100%",
    maxHeight: "200px",
    objectFit: "cover" as const,
    borderRadius: "4px",
    marginBottom: "16px",
    display: "block",
  } as React.CSSProperties,
  sectionHeading: {
    fontSize: "13pt",
    fontWeight: "bold",
    margin: "16px 0 6px 0",
    borderBottom: "1px solid #cccccc",
    paddingBottom: "2px",
  } as React.CSSProperties,
  groupHeading: {
    fontSize: "11pt",
    fontWeight: "bold",
    margin: "10px 0 4px 0",
    fontStyle: "italic",
  } as React.CSSProperties,
  ingredientList: {
    margin: "0",
    paddingLeft: "18px",
    listStyleType: "disc",
  } as React.CSSProperties,
  ingredientItem: {
    marginBottom: "2px",
  } as React.CSSProperties,
  description: {
    margin: "0 0 8px 0",
    whiteSpace: "pre-wrap" as const,
  } as React.CSSProperties,
  instructions: {
    margin: "0",
    whiteSpace: "pre-wrap" as const,
  } as React.CSSProperties,
  qrRow: {
    display: "flex",
    flexDirection: "row" as const,
    alignItems: "center",
    gap: "12px",
    marginTop: "20px",
    paddingTop: "12px",
    borderTop: "1px solid #cccccc",
  } as React.CSSProperties,
  qrText: {
    fontSize: "9pt",
    color: "#333333",
  } as React.CSSProperties,
  qrSubtext: {
    fontSize: "8pt",
    color: "#777777",
    wordBreak: "break-all" as const,
  } as React.CSSProperties,
};

export function RecipePrintView({ recipe, imageUrl, ingredients }: Props) {
  const groupedIngredients = groupIngredients(ingredients);
  const deeplink = `https://app.plateful.cloud/recipe/${recipe.id}`;

  return (
    <div id="recipe-print-view">
      <div style={s.wrapper}>
        <div style={s.header}>
          <h1 style={s.title}>{recipe.name}</h1>
          {recipe.link && <p style={s.sourceLink}>{recipe.link}</p>}
        </div>

        {imageUrl && (
          <img src={imageUrl} alt={recipe.name} style={s.image} crossOrigin="anonymous" />
        )}

        {recipe.description && (
          <>
            <p style={s.description}>{recipe.description}</p>
          </>
        )}

        {ingredients.length > 0 && (
          <>
            <h2 style={s.sectionHeading}>Ingredients</h2>
            {groupedIngredients.map((group, i) => (
              <div key={group.name ?? `g-${i}`}>
                {group.name && <p style={s.groupHeading}>{group.name}</p>}
                <ul style={s.ingredientList}>
                  {group.ingredients.map((ing) => (
                    <li key={ing.id} style={s.ingredientItem}>
                      {ing.rawText}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}

        {recipe.instructions && (
          <>
            <h2 style={s.sectionHeading}>Instructions</h2>
            <p style={s.instructions}>{recipe.instructions}</p>
          </>
        )}

        <div style={s.qrRow}>
          <QRCodeSVG value={deeplink} size={64} />
          <div>
            <p style={s.qrText}>Open in Plateful</p>
            <p style={s.qrSubtext}>{deeplink}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
