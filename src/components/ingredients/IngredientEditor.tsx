import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical, LayoutList } from "lucide-react";
import { useRecipeIngredients } from "@/hooks/ingredients/useRecipeIngredients";
import { useReplaceAllIngredients } from "@/hooks/ingredients/useIngredientMutations";
import type { RecipeIngredient, RecipeIngredientInput } from "@/types/ingredient.types";

export type EditorItem =
  | { type: "ingredient"; rawText: string }
  | { type: "section"; name: string };

/**
 * Convert server ingredients to editor items (for edit mode)
 * Inserts section headers when group_name changes
 */
export function ingredientsToEditorItems(ingredients: RecipeIngredient[]): EditorItem[] {
  const items: EditorItem[] = [];
  let currentGroup: string | null = null;

  for (const ing of ingredients) {
    if (ing.groupName !== currentGroup) {
      currentGroup = ing.groupName;
      if (currentGroup !== null) {
        items.push({ type: "section", name: currentGroup });
      }
    }
    items.push({ type: "ingredient", rawText: ing.rawText });
  }
  return items;
}

/**
 * Convert editor items to RecipeIngredientInput[] (for saving)
 * Walks the flat list and assigns groupName based on preceding section headers
 */
export function editorItemsToInputs(items: EditorItem[]): RecipeIngredientInput[] {
  const inputs: RecipeIngredientInput[] = [];
  let currentGroup: string | null = null;
  let sortOrder = 0;

  for (const item of items) {
    if (item.type === "section") {
      currentGroup = item.name.trim() || null;
    } else if (item.rawText.trim()) {
      inputs.push({
        rawText: item.rawText.trim(),
        groupName: currentGroup,
        sortOrder: sortOrder++,
      });
    }
  }
  return inputs;
}

type LocalEditorItem =
  | { type: "ingredient"; id: string; rawText: string }
  | { type: "section"; id: string; name: string };

type Props = {
  recipeId: string;
  onSave?: () => void;
};

export function IngredientEditor({ recipeId, onSave }: Props) {
  const { t } = useTranslation();
  const { data: existingIngredients = [], isLoading } = useRecipeIngredients(recipeId);
  const replaceAllMutation = useReplaceAllIngredients();

  // Convert existing ingredients to local state format with section headers
  const [localItems, setLocalItems] = useState<LocalEditorItem[]>(() => {
    const editorItems = ingredientsToEditorItems(existingIngredients);
    return editorItems.map((item, i) =>
      item.type === "section"
        ? { type: "section", id: `section-${i}`, name: item.name }
        : { type: "ingredient", id: `ing-${i}`, rawText: item.rawText }
    );
  });

  // Sync with server data when it loads
  useState(() => {
    if (existingIngredients.length > 0 && localItems.length === 0) {
      const editorItems = ingredientsToEditorItems(existingIngredients);
      setLocalItems(
        editorItems.map((item, i) =>
          item.type === "section"
            ? { type: "section", id: `section-${i}`, name: item.name }
            : { type: "ingredient", id: `ing-${i}`, rawText: item.rawText }
        )
      );
    }
  });

  const handleAddIngredient = useCallback(() => {
    setLocalItems((prev) => [
      ...prev,
      { type: "ingredient", id: `new-${Date.now()}`, rawText: "" },
    ]);
  }, []);

  const handleAddSection = useCallback(() => {
    setLocalItems((prev) => [
      ...prev,
      { type: "section", id: `section-${Date.now()}`, name: "" },
    ]);
  }, []);

  const handleUpdateItem = useCallback((index: number, value: string) => {
    setLocalItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      if (item.type === "section") {
        updated[index] = { ...item, name: value };
      } else {
        updated[index] = { ...item, rawText: value };
      }
      return updated;
    });
  }, []);

  const handleDeleteItem = useCallback((index: number) => {
    setLocalItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = async () => {
    const inputs = editorItemsToInputs(
      localItems.map((item) =>
        item.type === "section"
          ? { type: "section", name: item.name }
          : { type: "ingredient", rawText: item.rawText }
      )
    );

    await replaceAllMutation.mutateAsync({
      recipeId,
      inputs,
    });

    onSave?.();
  };

  const handleBulkAdd = (text: string) => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length > 1) {
      setLocalItems((prev) => [
        ...prev,
        ...lines.map((line) => ({
          type: "ingredient" as const,
          id: `new-${Date.now()}-${Math.random()}`,
          rawText: line,
        })),
      ]);
      return true;
    }
    return false;
  };

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-muted rounded-md" />;
  }

  return (
    <div className="space-y-2">
      {localItems.map((item, index) =>
        item.type === "section" ? (
          <div key={item.id} className="flex items-start gap-2 bg-muted/50 rounded-md p-1">
            <Input
              value={item.name}
              onChange={(e) => handleUpdateItem(index, e.target.value)}
              placeholder={t("ingredients.sectionPlaceholder")}
              className="font-semibold border-none bg-transparent"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteItem(index)}
              className="mt-0.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ) : (
          <div key={item.id} className="flex items-start gap-2">
            <div className="mt-2 text-muted-foreground cursor-grab">
              <GripVertical size={16} />
            </div>

            <Textarea
              value={item.rawText}
              onChange={(e) => handleUpdateItem(index, e.target.value)}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                if (handleBulkAdd(text)) {
                  e.preventDefault();
                }
              }}
              placeholder={t("ingredients.placeholder")}
              className="min-h-[40px] resize-none flex-1"
              rows={1}
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteItem(index)}
              className="mt-1 text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleAddIngredient}
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("ingredients.addIngredient")}
        </Button>

        <Button
          variant="outline"
          onClick={handleAddSection}
        >
          <LayoutList className="h-4 w-4 mr-2" />
          {t("ingredients.addSection")}
        </Button>
      </div>

      {localItems.some(
        (item) =>
          (item.type === "ingredient" && item.rawText.trim().length > 0) ||
          (item.type === "section" && item.name.trim().length > 0)
      ) && (
        <Button
          onClick={handleSave}
          disabled={replaceAllMutation.isPending}
          className="w-full mt-4"
        >
          {replaceAllMutation.isPending
            ? t("common.saving")
            : t("ingredients.saveIngredients")}
        </Button>
      )}
    </div>
  );
}

/**
 * Simple version for inline editing in AddRecipe form
 * Takes items as controlled state instead of fetching from server
 */
type SimpleEditorProps = {
  items: EditorItem[];
  onChange: (items: EditorItem[]) => void;
};

export function SimpleIngredientEditor({ items, onChange }: SimpleEditorProps) {
  const { t } = useTranslation();

  const handleAddIngredient = () => {
    onChange([...items, { type: "ingredient", rawText: "" }]);
  };

  const handleAddSection = () => {
    onChange([...items, { type: "section", name: "" }]);
  };

  const handleUpdate = (index: number, value: string) => {
    const updated = [...items];
    const item = updated[index];
    if (item.type === "section") {
      updated[index] = { ...item, name: value };
    } else {
      updated[index] = { ...item, rawText: value };
    }
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handlePaste = (index: number, text: string) => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length > 1) {
      const before = items.slice(0, index);
      const after = items.slice(index + 1);
      const newItems: EditorItem[] = lines.map((line) => ({
        type: "ingredient",
        rawText: line,
      }));
      onChange([...before, ...newItems, ...after]);
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) =>
        item.type === "section" ? (
          <div key={index} className="flex items-start gap-2 bg-muted/50 rounded-md p-1">
            <Input
              value={item.name}
              onChange={(e) => handleUpdate(index, e.target.value)}
              placeholder={t("ingredients.sectionPlaceholder")}
              className="font-semibold border-none bg-transparent"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(index)}
              className="mt-0.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ) : (
          <div key={index} className="flex items-start gap-2">
            <div className="mt-2 text-muted-foreground cursor-grab">
              <GripVertical size={16} />
            </div>

            <Textarea
              value={item.rawText}
              onChange={(e) => handleUpdate(index, e.target.value)}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                if (handlePaste(index, text)) {
                  e.preventDefault();
                }
              }}
              placeholder={t("ingredients.placeholder")}
              className="min-h-[40px] resize-none flex-1"
              rows={1}
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(index)}
              className="mt-1 text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleAddIngredient} className="flex-1">
          <Plus className="h-4 w-4 mr-2" />
          {t("ingredients.addIngredient")}
        </Button>

        <Button variant="outline" onClick={handleAddSection}>
          <LayoutList className="h-4 w-4 mr-2" />
          {t("ingredients.addSection")}
        </Button>
      </div>
    </div>
  );
}
