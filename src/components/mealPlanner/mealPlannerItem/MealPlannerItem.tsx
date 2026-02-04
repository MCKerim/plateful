import { useNavigate } from "react-router";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { useEffect, useRef, useState } from "react";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerTrigger } from "../../ui/drawer";
import { CalendarDays, Check, MoreVertical, Trash2 } from "lucide-react";
import DeleteDialog from "../../general/DeleteDialog";
import { useTranslation } from "react-i18next";
import { useDraggable } from "@dnd-kit/core";
import { useRecipeFirstImage } from "@/hooks/recipe/useRecipeFirstImage";

type Props = {
  id: string;
  recipeId: string;
  recipeName: string;
  eaten: boolean;
  onToggleEaten: () => void;
  onRecipeDelete: (id: string) => void;
  onEditPlan: () => void;
  isDragging?: boolean;
};

export default function MealPlannerItem({
  id,
  recipeId,
  recipeName,
  eaten,
  onToggleEaten,
  onRecipeDelete,
  onEditPlan,
  isDragging = false,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: imageUrl } = useRecipeFirstImage(recipeId);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const dragHandleRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef } = useDraggable({
    id: id,
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

  return (
    <Card
      ref={setNodeRef}
      className={`h-[72px] flex items-center ${isDragging ? "invisible" : ""} ${eaten ? "opacity-60" : ""}`}
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
        <img
          src={imageUrl || "/no-img.jpg"}
          alt="Recipe"
          className="h-full w-[74px] object-cover border-r-4 border-background dark:brightness-75 pointer-events-none select-none"
          draggable={false}
        />

        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/recipe/${recipeId}`);
          }}
          className="text-left flex-1 px-2.5 min-w-0 h-full flex items-center"
        >
          <p
            className={`second-font text-md font-semibold break-words leading-tight line-clamp-2 w-full`}
          >
            {recipeName}
          </p>
        </button>
      </div>

      <Button
        className={`rounded-full me-1 ${eaten ? "bg-accent text-accent-foreground border-accent" : ""}`}
        variant="outline"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onToggleEaten();
        }}
      >
        <Check className="!size-5" />
      </Button>

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

            <DeleteDialog
              onDelete={() => {
                setIsDrawerOpen(false);
                onRecipeDelete(id);
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
