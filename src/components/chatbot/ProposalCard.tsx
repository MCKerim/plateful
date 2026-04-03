import { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import MarkdownRenderer from "@/components/general/MarkdownRenderer";
import { getCategoryIdByTranslatedEnglishName, getTranslatedCategory } from "@/lib/recipeCategoryHelper/recipeCategoryHelper";
import { ToolOutputForUI, ChatbotIngredient } from "@/redux/slices/chatbotSlice";

interface ProposalCardProps {
  toolOutput: ToolOutputForUI;
  // For edit proposals the title may not be in args (only changed fields are sent).
  // Pass the original recipe title so the card always has something to show.
  displayTitle?: string;
  onNavigate?: (recipeId: string) => void;
  t: (key: string) => string;
}

const CHANGED_FIELD_LABELS: Record<string, string> = {
  title: "Title",
  description: "Description",
  servings: "Servings",
  category: "Category",
  ingredients: "Ingredients",
  instructions: "Instructions",
};

function IngredientList({ ingredients }: { ingredients: ChatbotIngredient[] }) {
  const sections = ingredients.reduce<{ section: string | null; items: string[] }[]>((acc, ing) => {
    const last = acc[acc.length - 1];
    if (last && last.section === ing.section) {
      last.items.push(ing.item);
    } else {
      acc.push({ section: ing.section, items: [ing.item] });
    }
    return acc;
  }, []);

  return (
    <>
      {sections.map((group, i) => (
        <div key={i}>
          {group.section && (
            <p className="text-xs font-semibold mt-2 mb-0.5">{group.section}</p>
          )}
          <ul className="list-disc list-inside text-xs space-y-0.5">
            {group.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

export function ProposalCard({ toolOutput, displayTitle, onNavigate, t }: ProposalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isEdit = toolOutput.toolName === "propose_recipe_edit";
  const { status, args, savedRecipeId } = toolOutput;

  const title = args.title ?? displayTitle ?? "";

  // ── Saved state ──────────────────────────────────────────────────────────────
  if (status === "saved") {
    return (
      <div className="mt-2 pt-2 border-t border-dashed border-secondary-foreground flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm font-medium min-w-0">
          <Check className="size-4 shrink-0 text-green-500" />
          <span className="truncate">{title}</span>
        </div>
        {savedRecipeId && onNavigate && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 h-7 px-2 text-xs"
            onClick={() => onNavigate(savedRecipeId)}
          >
            {t("common.open")} →
          </Button>
        )}
      </div>
    );
  }

  // ── Dismissed state ───────────────────────────────────────────────────────────
  if (status === "dismissed") {
    return (
      <div className="mt-2 pt-2 border-t border-dashed border-secondary-foreground">
        <p className="text-xs text-muted-foreground">
          {t("chatbot.proposalSkipped")} · {title}
        </p>
      </div>
    );
  }

  // ── Pending — edit proposal ───────────────────────────────────────────────────
  if (isEdit) {
    const changedFields = Object.keys(args).filter(
      (k) => k !== "recipeId" && CHANGED_FIELD_LABELS[k]
    );
    const hasExpandableContent =
      (args.ingredients && args.ingredients.length > 0) || !!args.instructions;

    return (
      <div className="mt-2 pt-2 border-t border-dashed border-secondary-foreground">
        <p className="second-font font-medium text-center text-sm mb-1">
          {t("chatbot.proposalEditLabel")} {title}
        </p>

        {changedFields.length > 0 && (
          <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
            {changedFields.map((field) => (
              <li key={field} className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                {CHANGED_FIELD_LABELS[field]}
                {field === "ingredients" && args.ingredients
                  ? ` (${args.ingredients.length})`
                  : ""}
              </li>
            ))}
          </ul>
        )}

        {hasExpandableContent && (
          <>
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground mt-2 w-full justify-center"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              {expanded ? t("chatbot.hideDetails") : t("chatbot.showDetails")}
            </button>

            {expanded && (
              <div className="max-h-52 overflow-y-auto mt-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="space-y-3 pr-2">
                  {args.ingredients && args.ingredients.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-1">{t("ingredients.title")}</p>
                      <IngredientList ingredients={args.ingredients} />
                    </div>
                  )}
                  {args.instructions && (
                    <div>
                      <p className="text-xs font-semibold mb-1">{t("recipe.instructions")}</p>
                      <MarkdownRenderer content={args.instructions} className="text-xs font-medium" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ── Pending — new recipe ──────────────────────────────────────────────────────
  const categoryId = args.category
    ? getCategoryIdByTranslatedEnglishName(args.category)
    : null;
  const displayCategory =
    categoryId !== null ? getTranslatedCategory(t, categoryId) : (args.category ?? "");
  const ingredientCount = args.ingredients?.length ?? 0;
  const hasExpandableContent =
    (args.ingredients && args.ingredients.length > 0) || !!args.instructions;

  return (
    <div className="mt-2 pt-2 border-t border-dashed border-secondary-foreground">
      <p className="second-font font-medium text-center">{title}</p>
      <p className="text-xs text-muted-foreground text-center mt-0.5">
        {[
          displayCategory,
          args.servings ? `${args.servings} ${t("addRecipe.servings").toLowerCase()}` : null,
          ingredientCount > 0 ? `${ingredientCount} ${t("ingredients.title").toLowerCase()}` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>

      {hasExpandableContent && (
        <>
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground mt-2 w-full justify-center"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            {expanded ? t("chatbot.hideDetails") : t("chatbot.showDetails")}
          </button>

          {expanded && (
            <div className="max-h-52 overflow-y-auto mt-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="space-y-3 pr-2">
                {args.description && (
                  <p className="text-xs text-muted-foreground">{args.description}</p>
                )}
                {args.ingredients && args.ingredients.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1">{t("ingredients.title")}</p>
                    <IngredientList ingredients={args.ingredients} />
                  </div>
                )}
                {args.instructions && (
                  <div>
                    <p className="text-xs font-semibold mb-1">{t("recipe.instructions")}</p>
                    <MarkdownRenderer content={args.instructions} className="text-xs font-medium" />
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
