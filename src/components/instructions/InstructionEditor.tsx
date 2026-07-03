import { useTranslation } from "react-i18next";
import {
  SimpleIngredientEditor,
  type EditorItem,
} from "@/components/ingredients/IngredientEditor";
import type { RecipeInstruction, RecipeInstructionInput } from "@/types/instruction.types";

let idCounter = 0;
function generateId() {
  return `step-editor-${Date.now()}-${idCounter++}`;
}

/**
 * Convert instruction steps to editor items (for edit mode).
 * Inserts section headers when group_name changes — same walk as
 * `ingredientsToEditorItems`.
 */
export function instructionsToEditorItems(
  steps: Array<Pick<RecipeInstruction, "stepText" | "groupName">>
): EditorItem[] {
  const items: EditorItem[] = [];
  let currentGroup: string | null = null;

  for (const step of steps) {
    if (step.groupName !== currentGroup) {
      currentGroup = step.groupName;
      if (currentGroup !== null) {
        items.push({ type: "section", id: generateId(), name: currentGroup });
      }
    }
    items.push({ type: "ingredient", id: generateId(), rawText: step.stepText });
  }
  return items;
}

/**
 * Convert editor items to instruction step inputs (for saving).
 * Walks the flat list and assigns groupName based on preceding section headers
 * — same walk as `editorItemsToInputs`.
 */
export function editorItemsToStepInputs(items: EditorItem[]): RecipeInstructionInput[] {
  const inputs: RecipeInstructionInput[] = [];
  let currentGroup: string | null = null;

  for (const item of items) {
    if (item.type === "section") {
      currentGroup = item.name.trim() || null;
    } else if (item.rawText.trim()) {
      inputs.push({
        stepText: item.rawText.trim(),
        groupName: currentGroup,
        sortOrder: inputs.length,
      });
    }
  }
  return inputs;
}

type Props = {
  items: EditorItem[];
  onChange: (items: EditorItem[]) => void;
};

/**
 * Controlled step/section editor for a recipe's instructions — the ingredient
 * editor with step wording (same rows, drag-reorder, add buttons).
 */
export function SimpleInstructionEditor({ items, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <SimpleIngredientEditor
      items={items}
      onChange={onChange}
      labels={{
        placeholder: t("instructions.stepPlaceholder"),
        sectionPlaceholder: t("instructions.sectionPlaceholder"),
        addLine: t("instructions.step"),
        addSection: t("ingredients.section"),
      }}
    />
  );
}
