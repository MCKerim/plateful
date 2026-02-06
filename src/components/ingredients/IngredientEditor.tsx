import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useRecipeIngredients } from "@/hooks/ingredients/useRecipeIngredients";
import { useReplaceAllIngredients } from "@/hooks/ingredients/useIngredientMutations";
import type { RecipeIngredientInput } from "@/types/ingredient.types";

type LocalIngredient = {
  id: string;
  rawText: string;
  isNew: boolean;
};

type Props = {
  recipeId: string;
  onSave?: () => void;
};

export function IngredientEditor({ recipeId, onSave }: Props) {
  const { t } = useTranslation();
  const { data: existingIngredients = [], isLoading } = useRecipeIngredients(recipeId);
  const replaceAllMutation = useReplaceAllIngredients();

  // Convert existing ingredients to local state format
  const [localIngredients, setLocalIngredients] = useState<LocalIngredient[]>(() =>
    existingIngredients.map((ing) => ({
      id: ing.id,
      rawText: ing.rawText,
      isNew: false,
    }))
  );

  // Sync with server data when it loads
  useState(() => {
    if (existingIngredients.length > 0 && localIngredients.length === 0) {
      setLocalIngredients(
        existingIngredients.map((ing) => ({
          id: ing.id,
          rawText: ing.rawText,
          isNew: false,
        }))
      );
    }
  });

  const handleAddIngredient = useCallback(() => {
    setLocalIngredients((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        rawText: "",
        isNew: true,
      },
    ]);
  }, []);

  const handleUpdateIngredient = useCallback((index: number, rawText: string) => {
    setLocalIngredients((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], rawText };
      return updated;
    });
  }, []);

  const handleDeleteIngredient = useCallback((index: number) => {
    setLocalIngredients((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = async () => {
    // Filter out empty ingredients and prepare for save
    const nonEmptyIngredients: RecipeIngredientInput[] = localIngredients
      .filter((ing) => ing.rawText.trim().length > 0)
      .map((ing, index) => ({
        rawText: ing.rawText.trim(),
        sortOrder: index,
      }));

    await replaceAllMutation.mutateAsync({
      recipeId,
      inputs: nonEmptyIngredients,
    });

    onSave?.();
  };

  const handleBulkAdd = (text: string) => {
    // Split by newlines and add each line as an ingredient
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length > 1) {
      setLocalIngredients((prev) => [
        ...prev,
        ...lines.map((line) => ({
          id: `new-${Date.now()}-${Math.random()}`,
          rawText: line,
          isNew: true,
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
      {localIngredients.map((ingredient, index) => (
        <div key={ingredient.id} className="flex items-start gap-2">
          <div className="mt-2 text-muted-foreground cursor-grab">
            <GripVertical size={16} />
          </div>

          <Textarea
            value={ingredient.rawText}
            onChange={(e) => handleUpdateIngredient(index, e.target.value)}
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
            onClick={() => handleDeleteIngredient(index)}
            className="mt-1 text-muted-foreground hover:text-destructive"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ))}

      <Button
        variant="outline"
        onClick={handleAddIngredient}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        {t("ingredients.addIngredient")}
      </Button>

      {localIngredients.some((ing) => ing.rawText.trim().length > 0) && (
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
 * Takes ingredients as controlled state instead of fetching from server
 */
type SimpleEditorProps = {
  ingredients: string[];
  onChange: (ingredients: string[]) => void;
};

export function SimpleIngredientEditor({ ingredients, onChange }: SimpleEditorProps) {
  const { t } = useTranslation();

  const handleAdd = () => {
    onChange([...ingredients, ""]);
  };

  const handleUpdate = (index: number, value: string) => {
    const updated = [...ingredients];
    updated[index] = value;
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    onChange(ingredients.filter((_, i) => i !== index));
  };

  const handlePaste = (index: number, text: string) => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length > 1) {
      const before = ingredients.slice(0, index);
      const after = ingredients.slice(index + 1);
      onChange([...before, ...lines, ...after]);
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-2">
      {ingredients.map((ingredient, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="mt-2 text-muted-foreground cursor-grab">
            <GripVertical size={16} />
          </div>

          <Textarea
            value={ingredient}
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
      ))}

      <Button variant="outline" onClick={handleAdd} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        {t("ingredients.addIngredient")}
      </Button>
    </div>
  );
}
