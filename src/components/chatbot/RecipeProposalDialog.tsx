import { useState } from "react";
import { DialogDescription, DialogTitle, DialogTrigger } from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import MarkdownRenderer from "@/components/general/MarkdownRenderer";
import { useRecipe } from "@/hooks/recipe/useRecipe";
import { useRecipeIngredients } from "@/hooks/ingredients/useRecipeIngredients";
import { getEnglishCategoryNameById, getCategoryIdByTranslatedEnglishName, getTranslatedCategory } from "@/lib/recipeCategoryHelper/recipeCategoryHelper";
import { ToolOutputForUI, NewRecipeProposal, EditRecipeProposal, ChatbotIngredient } from "@/redux/slices/chatbotSlice";

interface RecipeProposalDialogProps {
  toolOutput: ToolOutputForUI;
  onSaveNew: (proposal: NewRecipeProposal) => void;
  onSaveEdit: (proposal: EditRecipeProposal) => void;
  t: (key: string) => string;
}

export function RecipeProposalDialog({
  toolOutput,
  onSaveNew,
  onSaveEdit,
  t,
}: RecipeProposalDialogProps) {
  const [open, setOpen] = useState(false);
  const isEditProposal = toolOutput.toolName === "propose_recipe_edit";
  const editRecipeId = isEditProposal ? toolOutput.args.recipeId : null;

  // Fetch original recipe data and ingredients for edit proposals to merge with partial updates
  const { data: originalRecipe } = useRecipe(editRecipeId ?? null);
  const { data: originalIngredients } = useRecipeIngredients(editRecipeId ?? null);

  // For edit proposals, merge tool output with original recipe (tool output takes precedence)
  const getMergedString = (
    toolValue: string | undefined,
    fallback: string | null | undefined
  ) => {
    if (toolValue !== undefined && toolValue !== null) return toolValue;
    if (isEditProposal && originalRecipe) return fallback ?? "";
    return "";
  };

  const finalTitle = getMergedString(toolOutput.args.title, originalRecipe?.name);
  const finalDescription = getMergedString(toolOutput.args.description, originalRecipe?.description);
  const finalCategory = getMergedString(
    toolOutput.args.category,
    originalRecipe ? getEnglishCategoryNameById(originalRecipe.category) : undefined
  );
  const finalServings = toolOutput.args.servings ?? originalRecipe?.base_servings ?? undefined;
  const finalIngredients: ChatbotIngredient[] | undefined =
    toolOutput.args.ingredients ??
    (isEditProposal && originalIngredients?.length
      ? originalIngredients.map((ing) => ({ item: ing.rawText, section: ing.groupName }))
      : undefined);
  const categoryId = getCategoryIdByTranslatedEnglishName(finalCategory);
  const displayCategory = categoryId !== null ? getTranslatedCategory(t, categoryId) : finalCategory;

  const finalInstructions = getMergedString(
    toolOutput.args.instructions,
    originalRecipe?.instructions
  );

  // Group ingredients by section for display
  const ingredientSections = finalIngredients
    ? finalIngredients.reduce<{ section: string | null; items: string[] }[]>(
        (acc, ing) => {
          const lastGroup = acc[acc.length - 1];
          if (lastGroup && lastGroup.section === ing.section) {
            lastGroup.items.push(ing.item);
          } else {
            acc.push({ section: ing.section, items: [ing.item] });
          }
          return acc;
        },
        []
      )
    : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div>
          <p className="second-font font-medium mt-2 border-t border-dashed border-secondary-foreground pt-2 text-center">
            {finalTitle}
          </p>

          <Button variant="accent" size="sm" className="mt-2 w-full">
            <span className="truncate">
              {isEditProposal ? t("chatbot.previewEditedRecipe") : t("chatbot.previewRecipe")}
            </span>
          </Button>
        </div>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="second-font text-lg font-bold mt-2">{finalTitle}</DialogTitle>

          <DialogDescription className="text-sm font-medium text-muted-foreground">
            {displayCategory}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] rounded-md border p-2">
          {finalDescription && (
            <p className="text-sm text-muted-foreground mb-3">{finalDescription}</p>
          )}

          {finalServings && (
            <p className="text-sm font-medium mb-3">
              {t("addRecipe.servings")}: {finalServings}
            </p>
          )}

          {ingredientSections.length > 0 && (
            <div className="mb-3">
              <h3 className="text-sm font-semibold mb-1">{t("ingredients.title")}</h3>
              {ingredientSections.map((group, i) => (
                <div key={i}>
                  {group.section && (
                    <p className="text-sm font-semibold mt-2 mb-0.5">{group.section}</p>
                  )}
                  <ul className="list-disc list-inside text-sm">
                    {group.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {finalInstructions && (
            <div>
              <h3 className="text-sm font-semibold mb-1">{t("recipe.instructions")}</h3>
              <MarkdownRenderer content={finalInstructions} className="font-medium" />
            </div>
          )}
        </ScrollArea>

        <div className="text-sm text-muted-foreground">
          {isEditProposal ? t("chatbot.updateRecipePrompt") : t("chatbot.saveRecipePrompt")}
        </div>

        <DialogFooter className="flex-row w-full gap-2">
          <DialogClose className="w-full">
            <Button variant="secondary" className="w-full">
              {t("common.cancel")}
            </Button>
          </DialogClose>

          <Button
            className="w-full"
            variant="accent"
            onClick={() => {
              if (isEditProposal && editRecipeId) {
                onSaveEdit({
                  proposalId: toolOutput.proposalId,
                  recipeId: editRecipeId,
                  title: finalTitle,
                  description: finalDescription,
                  servings: finalServings,
                  ingredients: finalIngredients,
                  instructions: finalInstructions,
                  category: finalCategory,
                  link: originalRecipe?.link ?? "",
                });
              } else {
                onSaveNew({
                  proposalId: toolOutput.proposalId,
                  title: finalTitle,
                  description: finalDescription,
                  servings: finalServings,
                  ingredients: finalIngredients,
                  instructions: finalInstructions,
                  category: finalCategory,
                });
              }
              setOpen(false);
            }}
          >
            {isEditProposal ? t("common.update") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
