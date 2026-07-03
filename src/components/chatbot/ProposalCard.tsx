import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import MarkdownRenderer from "@/components/general/MarkdownRenderer";
import { getCategoryIdByTranslatedEnglishName, getTranslatedCategory } from "@/lib/recipeCategoryHelper/recipeCategoryHelper";
import { TOOL_PROPOSE_EDIT, ToolOutputForUI, ChatbotIngredient } from "@/redux/slices/chatbotSlice";

interface ProposalCardProps {
  toolOutput: ToolOutputForUI;
  displayTitle?: string;
  onNavigate?: (recipeId: string) => void;
  t: (key: string) => string;
  isActive?: boolean;
}

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

export function ProposalCard({ toolOutput, displayTitle, onNavigate, t, isActive }: ProposalCardProps) {
  const isEdit = toolOutput.toolName === TOOL_PROPOSE_EDIT;
  const { status, args, savedRecipeId } = toolOutput;
  const title = args.title ?? displayTitle ?? "";
  const [expanded, setExpanded] = useState(false);

  // Auto-expand when this becomes the active proposal
  useEffect(() => {
    if (isActive && status === "pending") setExpanded(true);
  }, [isActive, status]);

  // Auto-collapse when the user acts on the proposal
  useEffect(() => {
    if (status !== "pending") setExpanded(false);
  }, [status]);

  const categoryId = !isEdit && args.category
    ? getCategoryIdByTranslatedEnglishName(args.category)
    : null;
  const displayCategory =
    categoryId !== null ? getTranslatedCategory(t, categoryId) : (args.category ?? "");

  const hasDetailContent =
    (args.ingredients && args.ingredients.length > 0) || !!args.instructions;

  return (
    <div className="mt-2 pt-2 border-t border-dashed border-secondary-foreground">
      {/* Header row — entire row toggles expand/collapse */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {status === "saved" && <Check className="size-3.5 shrink-0 text-green-500" />}
        {status === "dismissed" && <X className="size-3.5 shrink-0 text-red-500" />}
        <p className={"second-font font-medium text-sm truncate flex-1"}>
          {isEdit ? `${t("chatbot.proposalEditLabel")} ` : ""}
          {title}
        </p>
        {status === "saved" && savedRecipeId && onNavigate && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs shrink-0"
            onClick={(e) => { e.stopPropagation(); onNavigate(savedRecipeId); }}
          >
            {t("common.open")}
          </Button>
        )}
        {expanded ? (
          <ChevronUp className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-2 space-y-2">
          {!isEdit && (
            <p className="text-xs text-muted-foreground">
              {[
                displayCategory,
                args.servings ? `${args.servings} ${t("addRecipe.servings").toLowerCase()}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          {hasDetailContent && (
            <div>
              <div className="space-y-3">
                {args.description && !isEdit && (
                  <p className="text-xs">{args.description}</p>
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
                    <MarkdownRenderer content={args.instructions} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
