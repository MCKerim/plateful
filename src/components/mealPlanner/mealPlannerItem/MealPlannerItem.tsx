import { useNavigate } from "react-router";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { useEffect, useRef, useState } from "react";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerTrigger } from "../../ui/drawer";
import {
  CalendarDays,
  CalendarOff,
  Check,
  MoreVertical,
  Pencil,
  StickyNote,
  Trash2,
} from "lucide-react";
import DeleteDialog from "../../general/DeleteDialog";
import { useTranslation } from "react-i18next";
import { useDraggable } from "@dnd-kit/core";
import { isBefore, startOfToday } from "date-fns";
import { useRecipeFirstImage } from "@/hooks/recipe/useRecipeFirstImage";
import { MealPlannerItem as MealPlannerItemType } from "@/types/meal-planning.types";

type Props = {
  item: MealPlannerItemType;
  /** Recipes only: flips the cooked state. */
  onToggleEaten?: () => void;
  /** Takes this placement off the plan. */
  onRemove: () => void;
  /** Opens the weekly plan dialog for the recipe or the note. */
  onEditPlan: () => void;
  /** Notes only: opens the text editor (also the row's tap). */
  onEditNote?: () => void;
  onMoveToNoDate?: () => void;
  isDragging?: boolean;
};

/**
 * One planned entry: a recipe (cover, name, cooked check) or a note (note
 * symbol, text). Same card, same drag handle and menu for both; a note has
 * no cooked state, and a past note only recedes.
 */
export default function MealPlannerItem({
  item,
  onToggleEaten,
  onRemove,
  onEditPlan,
  onEditNote,
  onMoveToNoDate,
  isDragging = false,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: imageUrl } = useRecipeFirstImage(item.kind === "recipe" ? item.recipeId : null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const dragHandleRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef } = useDraggable({
    id: item.id,
    data: {
      type: "meal-planner-item",
    },
  });

  // Custom touch handler to prevent scroll during long-press detection
  useEffect(() => {
    const element = dragHandleRef.current;
    if (!element) return;

    let touchStartY = 0;
    let touchStartX = 0;
    let longPressTimer: ReturnType<typeof setTimeout> | null = null;
    let shouldPreventScroll = false;
    let hasMoved = false;

    const DELAY = 250; // Match your TouchSensor delay
    const TOLERANCE = 10; // Slightly higher than sensor tolerance for smoother UX

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartY = touch.clientY;
      touchStartX = touch.clientX;
      shouldPreventScroll = false;
      hasMoved = false;

      // Start timer - if user holds without moving, we'll prevent scroll
      longPressTimer = setTimeout(() => {
        if (!hasMoved) {
          shouldPreventScroll = true;
        }
      }, DELAY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaY = Math.abs(touch.clientY - touchStartY);
      const deltaX = Math.abs(touch.clientX - touchStartX);

      // If user moved beyond tolerance before timer fired
      if (deltaY > TOLERANCE || deltaX > TOLERANCE) {
        hasMoved = true;

        // Cancel the long press timer
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }

        // If we haven't activated long press, allow scrolling
        if (!shouldPreventScroll) {
          return;
        }
      }

      // Prevent scroll if long press is active OR if we're still in the detection phase
      // and haven't moved beyond tolerance
      if (shouldPreventScroll || (longPressTimer !== null && !hasMoved)) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      shouldPreventScroll = false;
      hasMoved = false;
    };

    // IMPORTANT: Use passive: false to be able to call preventDefault()
    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });
    element.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", handleTouchEnd);
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, []);

  const eaten = item.kind === "recipe" && item.eaten;
  // A past note recedes like a cooked recipe. Presentation only: a note has
  // no cooked state, and it stays editable and draggable.
  const isPastNote =
    item.kind === "note" &&
    item.planned_date !== null &&
    isBefore(item.planned_date, startOfToday());
  const title = item.kind === "recipe" ? item.recipeName : item.text;

  function open() {
    if (item.kind === "recipe") {
      navigate(`/recipe/${item.recipeId}`);
    } else {
      onEditNote?.();
    }
  }

  return (
    <Card
      ref={setNodeRef}
      className={`h-[72px] flex items-center ${isDragging ? "invisible" : ""} ${eaten || isPastNote ? "opacity-60" : ""}`}
    >
      <div
        ref={dragHandleRef}
        className="flex h-full flex-1 items-center min-w-0 cursor-grab active:cursor-grabbing select-none"
        style={{
          // Use style for better WebView compatibility
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
        }}
        {...listeners}
        {...attributes}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="h-full shrink-0"
          aria-label={item.kind === "note" ? t("mealPlannerItem.editNote") : undefined}
        >
          {item.kind === "recipe" ? (
            <img
              src={imageUrl || "/no-img.jpg"}
              alt="Recipe"
              className="h-full w-[74px] object-cover border-r-4 border-background dark:brightness-75 pointer-events-none select-none"
              draggable={false}
            />
          ) : (
            <div className="h-full w-[74px] flex items-center justify-center bg-muted border-r-4 border-background text-muted-foreground">
              <StickyNote size={28} />
            </div>
          )}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="text-left flex-1 px-2.5 min-w-0 h-full flex flex-col justify-center gap-0.5"
        >
          <p className="text-md font-semibold break-words leading-tight line-clamp-2 w-full">
            {title}
          </p>
        </button>
      </div>

      {item.kind === "recipe" && onToggleEaten && (
        <Button
          className={`rounded-full me-1 ${eaten ? "bg-accent text-accent-foreground border-accent" : ""}`}
          variant="outline"
          size="icon"
          aria-label={t("home.markComplete")}
          onClick={(e) => {
            e.stopPropagation();
            onToggleEaten();
          }}
        >
          <Check className="!size-5" />
        </Button>
      )}

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <Button className="p-3" variant="ghost">
            <MoreVertical size={16} />
          </Button>
        </DrawerTrigger>

        <DrawerContent>
          <DrawerFooter className="gap-2 mb-8 mt-4">
            <DrawerClose asChild>
              <Button className="w-full" onClick={onEditPlan}>
                <CalendarDays size={20} />
                {t("mealPlannerItem.editPlan")}
              </Button>
            </DrawerClose>

            {item.kind === "note" && onEditNote && (
              <DrawerClose asChild>
                <Button className="w-full" variant="secondary" onClick={onEditNote}>
                  <Pencil size={20} />
                  {t("mealPlannerItem.editNote")}
                </Button>
              </DrawerClose>
            )}

            {onMoveToNoDate && (
              <DrawerClose asChild>
                <Button className="w-full" variant="secondary" onClick={onMoveToNoDate}>
                  <CalendarOff size={20} />
                  {t("mealPlannerItem.moveToNoDate")}
                </Button>
              </DrawerClose>
            )}

            <DeleteDialog
              onDelete={() => {
                setIsDrawerOpen(false);
                onRemove();
              }}
              customTrigger={
                <Button className="w-full" variant="destructive">
                  <Trash2 size={16} />
                  {t("mealPlannerItem.remove")}
                </Button>
              }
            />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Card>
  );
}
