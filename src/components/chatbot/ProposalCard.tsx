import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCategoryIdByTranslatedEnglishName, getTranslatedCategory } from "@/lib/recipeCategoryHelper/recipeCategoryHelper";
import { ToolOutputForUI } from "@/redux/slices/chatbotSlice";

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

export function ProposalCard({ toolOutput, displayTitle, onNavigate, t }: ProposalCardProps) {
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

  // ── Pending state ─────────────────────────────────────────────────────────────
  if (isEdit) {
    const changedFields = Object.keys(args).filter(
      (k) => k !== "recipeId" && CHANGED_FIELD_LABELS[k]
    );

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
                  ? ` (${args.ingredients.length} items)`
                  : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // New recipe pending
  const categoryId = args.category
    ? getCategoryIdByTranslatedEnglishName(args.category)
    : null;
  const displayCategory =
    categoryId !== null ? getTranslatedCategory(t, categoryId) : (args.category ?? "");
  const ingredientCount = args.ingredients?.length ?? 0;

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
    </div>
  );
}
