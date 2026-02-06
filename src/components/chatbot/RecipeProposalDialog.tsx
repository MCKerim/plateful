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
import { getEnglishCategoryNameById } from "@/lib/recipeCategoryHelper/recipeCategoryHelper";
import { ToolOutputForUI } from "@/redux/slices/chatbotSlice";

interface RecipeProposalDialogProps {
  toolOutput: ToolOutputForUI;
  onSaveNew: (proposalId: string, title: string, instructions: string, category: string) => void;
  onSaveEdit: (
    proposalId: string,
    recipeId: string,
    title: string,
    instructions: string,
    category: string,
    link: string
  ) => void;
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

  // Fetch original recipe data for edit proposals to merge with partial updates
  const { data: originalRecipe } = useRecipe(editRecipeId ?? null);

  // For edit proposals, merge tool output with original recipe (tool output takes precedence)
  const getMergedValue = (field: "title" | "instructions" | "category") => {
    const toolValue =
      field === "title"
        ? toolOutput.args.title
        : field === "instructions"
          ? toolOutput.args.description
          : toolOutput.args.category;

    if (toolValue !== undefined && toolValue !== null) {
      return toolValue;
    }

    // Fall back to original recipe data for edit proposals
    if (isEditProposal && originalRecipe) {
      if (field === "title") return originalRecipe.name;
      if (field === "instructions") return originalRecipe.instructions ?? "";
      if (field === "category") return getEnglishCategoryNameById(originalRecipe.category);
    }

    return "";
  };

  const finalTitle = getMergedValue("title");
  const finalInstructions = getMergedValue("instructions");
  const finalCategory = getMergedValue("category");

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
            {finalCategory}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] rounded-md border p-2">
          <MarkdownRenderer content={finalInstructions} className="font-medium" />
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
                onSaveEdit(
                  toolOutput.proposalId,
                  editRecipeId,
                  finalTitle,
                  finalInstructions,
                  finalCategory,
                  originalRecipe?.link ?? ""
                );
              } else {
                onSaveNew(toolOutput.proposalId, finalTitle, finalInstructions, finalCategory);
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
