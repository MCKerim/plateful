import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical, LayoutList, X } from "lucide-react";
import { useRecipeIngredients } from "@/hooks/ingredients/useRecipeIngredients";
import { useReplaceAllIngredients } from "@/hooks/ingredients/useIngredientMutations";
import type { RecipeIngredient, RecipeIngredientInput } from "@/types/ingredient.types";

let idCounter = 0;
function generateId() {
  return `editor-${Date.now()}-${idCounter++}`;
}

export type EditorItem =
  | { type: "ingredient"; id: string; rawText: string }
  | { type: "section"; id: string; name: string };

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
        items.push({ type: "section", id: generateId(), name: currentGroup });
      }
    }
    items.push({ type: "ingredient", id: generateId(), rawText: ing.rawText });
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

// --- Shared sortable item component ---

type SortableEditorItemProps = {
  item: EditorItem;
  index: number;
  onUpdate: (index: number, value: string) => void;
  onDelete: (index: number) => void;
  onPaste?: (index: number, text: string) => boolean;
  placeholder: string;
  sectionPlaceholder: string;
};

function SortableEditorItem({
  item,
  index,
  onUpdate,
  onDelete,
  onPaste,
  placeholder,
  sectionPlaceholder,
}: SortableEditorItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  if (item.type === "section") {
    return (
      <div ref={setNodeRef} style={style} className="flex items-center gap-2">
        <div
          className="text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </div>

        <Input
          value={item.name}
          onChange={(e) => onUpdate(index, e.target.value)}
          placeholder={sectionPlaceholder}
          className="font-semibold border-none bg-transparent"
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(index)}
          className="text-muted-foreground"
        >
          <X className="!size-6" />
        </Button>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2">
      <div
        className="mt-2 text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </div>

      <Textarea
        value={item.rawText}
        onChange={(e) => onUpdate(index, e.target.value)}
        onPaste={
          onPaste
            ? (e) => {
                const text = e.clipboardData.getData("text");
                if (onPaste(index, text)) {
                  e.preventDefault();
                }
              }
            : undefined
        }
        placeholder={placeholder}
        rows={1}
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(index)}
        className="text-muted-foreground"
      >
        <X className="!size-6" />
      </Button>
    </div>
  );
}

// --- Shared sensors hook ---

function useEditorSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );
}

function lockScroll() {
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";
  const main = document.querySelector("main");
  if (main) main.style.overflow = "hidden";
}

function unlockScroll() {
  document.body.style.overflow = "";
  document.body.style.touchAction = "";
  const main = document.querySelector("main");
  if (main) main.style.overflow = "";
}

// --- IngredientEditor (server-backed) ---

type LocalEditorItem = EditorItem;

type Props = {
  recipeId: string;
  onSave?: () => void;
};

export function IngredientEditor({ recipeId, onSave }: Props) {
  const { t } = useTranslation();
  const { data: existingIngredients = [], isLoading } = useRecipeIngredients(recipeId);
  const replaceAllMutation = useReplaceAllIngredients();
  const sensors = useEditorSensors();

  const [localItems, setLocalItems] = useState<LocalEditorItem[]>(() =>
    ingredientsToEditorItems(existingIngredients)
  );

  // Sync with server data when it loads
  useState(() => {
    if (existingIngredients.length > 0 && localItems.length === 0) {
      setLocalItems(ingredientsToEditorItems(existingIngredients));
    }
  });

  const handleAddIngredient = useCallback(() => {
    setLocalItems((prev) => [...prev, { type: "ingredient", id: generateId(), rawText: "" }]);
  }, []);

  const handleAddSection = useCallback(() => {
    setLocalItems((prev) => [...prev, { type: "section", id: generateId(), name: "" }]);
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

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    unlockScroll();
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalItems((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === active.id);
        const newIndex = prev.findIndex((item) => item.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  const handleSave = async () => {
    const inputs = editorItemsToInputs(localItems);

    await replaceAllMutation.mutateAsync({
      recipeId,
      inputs,
    });

    onSave?.();
  };

  const handleBulkAdd = useCallback((index: number, text: string) => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length > 1) {
      setLocalItems((prev) => {
        const before = prev.slice(0, index);
        const after = prev.slice(index + 1);
        const newItems: LocalEditorItem[] = lines.map((line) => ({
          type: "ingredient",
          id: generateId(),
          rawText: line,
        }));
        return [...before, ...newItems, ...after];
      });
      return true;
    }
    return false;
  }, []);

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-muted rounded-md" />;
  }

  const itemIds = localItems.map((item) => item.id);

  return (
    <div className="space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={lockScroll}
        onDragEnd={handleDragEnd}
        onDragCancel={unlockScroll}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {localItems.map((item, index) => (
            <SortableEditorItem
              key={item.id}
              item={item}
              index={index}
              onUpdate={handleUpdateItem}
              onDelete={handleDeleteItem}
              onPaste={handleBulkAdd}
              placeholder={t("ingredients.placeholder")}
              sectionPlaceholder={t("ingredients.sectionPlaceholder")}
            />
          ))}
        </SortableContext>
      </DndContext>

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
          {replaceAllMutation.isPending ? t("common.saving") : t("ingredients.saveIngredients")}
        </Button>
      )}
    </div>
  );
}

// --- SimpleIngredientEditor (controlled, for AddRecipe form) ---

type SimpleEditorProps = {
  items: EditorItem[];
  onChange: (items: EditorItem[]) => void;
};

export function SimpleIngredientEditor({ items, onChange }: SimpleEditorProps) {
  const { t } = useTranslation();
  const sensors = useEditorSensors();

  const handleAddIngredient = () => {
    onChange([...items, { type: "ingredient", id: generateId(), rawText: "" }]);
  };

  const handleAddSection = () => {
    onChange([...items, { type: "section", id: generateId(), name: "" }]);
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
        id: generateId(),
        rawText: line,
      }));
      onChange([...before, ...newItems, ...after]);
      return true;
    }
    return false;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    unlockScroll();
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      onChange(arrayMove(items, oldIndex, newIndex));
    }
  };

  const itemIds = items.map((item) => item.id);

  return (
    <div className="space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={lockScroll}
        onDragEnd={handleDragEnd}
        onDragCancel={unlockScroll}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {items.map((item, index) => (
            <SortableEditorItem
              key={item.id}
              item={item}
              index={index}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onPaste={handlePaste}
              placeholder={t("ingredients.placeholder")}
              sectionPlaceholder={t("ingredients.sectionPlaceholder")}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={handleAddIngredient} className="flex-1">
          <Plus className="h-4 w-4 mr-2" />
          {t("ingredients.addIngredient")}
        </Button>

        <Button variant="secondary" onClick={handleAddSection}>
          <LayoutList className="h-4 w-4 mr-2" />
          {t("ingredients.addSection")}
        </Button>
      </div>
    </div>
  );
}
