import MealPlannerItem from "@/components/atoms/MealPlannerItem";
import Layout from "@/components/layout/Layout";
import { useEffect, useRef, useState } from "react";
import { useSupabase } from "@/utils/supabase";
import {
  format,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
  isSameWeek,
} from "date-fns";
import RatingModal, { RatingModalRef } from "@/components/atoms/RatingModal";
import MealPlannerAdd from "@/components/atoms/MealPlannerAdd";
import { getWeekdays } from "@/lib/dateHelper";
import { Button } from "@/components/ui/button";
import {
  CalendarOff,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  useDroppable,
  Modifier,
  DragOverlay,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { enUS, es, fr, de } from "date-fns/locale";
import { Card } from "@/components/ui/card";

type MealPlannerItemType = {
  id: number;
  recipeId: number;
  recipeName: string;
  planned_date: Date | null;
  days: number;
  daysEaten: number;
};

const locales = {
  en: enUS,
  es: es,
  fr: fr,
  de: de,
};

const restrictToVerticalAxisAndWindow: Modifier = ({
  transform,
  draggingNodeRect,
  windowRect,
}) => {
  if (!draggingNodeRect || !windowRect) {
    return transform;
  }

  return {
    ...transform,
    x: 0,
    y: Math.max(
      Math.min(
        transform.y,
        windowRect.height - draggingNodeRect.top - draggingNodeRect.height
      ),
      -draggingNodeRect.top
    ),
  };
};

export default function MealPlanner() {
  const { t, i18n } = useTranslation();
  const { supabase } = useSupabase();
  const navigate = useNavigate();

  const [plannedItems, setPlannedItems] = useState<MealPlannerItemType[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [activeItem, setActiveItem] = useState<MealPlannerItemType | null>(
    null
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Default closed

  const ratingModalRef = useRef<RatingModalRef>(null);
  const [recipeToRate, setRecipeToRate] = useState<number>();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  useEffect(() => {
    getMealPlannerItems();
  }, []);

  // Open drawer by default only if there are unplanned items
  useEffect(() => {
    const unplannedItems = plannedItems.filter(
      (item) => item.planned_date === null && item.daysEaten < item.days
    );
    if (unplannedItems.length > 0) {
      setIsDrawerOpen(true);
    } else {
      setIsDrawerOpen(false);
    }
  }, [plannedItems.length]); // Only run when items count changes

  useEffect(() => {
    if (activeItem !== null) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";

      const mainContent = document.querySelector("main");
      if (mainContent) {
        mainContent.style.overflow = "hidden";
      }
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";

      const mainContent = document.querySelector("main");
      if (mainContent) {
        mainContent.style.overflow = "";
      }
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      const mainContent = document.querySelector("main");
      if (mainContent) {
        mainContent.style.overflow = "";
      }
    };
  }, [activeItem]);

  async function getMealPlannerItems() {
    const { data } = await supabase
      .from("meal_planning")
      .select(
        `
        id,
        planned_date,
        days,
        daysEaten,
        recipes (id, name)
      `
      )
      .order("created_at", { ascending: true });

    const newItems: MealPlannerItemType[] = [];

    if (!data) {
      setPlannedItems(newItems);
      return;
    }

    data.forEach((item) => {
      const newItem: MealPlannerItemType = {
        id: item.id,
        recipeId: item.recipes?.id ?? 1,
        planned_date: item.planned_date ? new Date(item.planned_date) : null,
        recipeName: item.recipes?.name ?? "no name",
        days: item.days,
        daysEaten: item.daysEaten,
      };
      newItems.push(newItem);
    });

    setPlannedItems(newItems);
  }

  async function deletePlannedItem(id: number) {
    const { error } = await supabase
      .from("meal_planning")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error while deleting planned item: ", error);
      alert("Error while deleting planned item");
    } else {
      setPlannedItems(plannedItems.filter((item) => item.id !== id));
    }
  }

  async function updatePlannedItemDate(
    id: number,
    newDate: Date | null,
    newDays: number
  ) {
    const plannedDate = newDate ? newDate.toISOString() : null;
    const { error } = await supabase
      .from("meal_planning")
      .update({ planned_date: plannedDate, days: newDays })
      .eq("id", id);

    if (error) {
      console.error("Error while updating planned item date: ", error);
      alert("Error while updating planned item date");
      getMealPlannerItems();
    } else {
      toast.success(t("recipe.planningSuccessful"), {
        position: "top-right",
        richColors: true,
      });
      getMealPlannerItems();
    }
  }

  async function setDaysEaten(id: number, newDaysEaten: number) {
    const { error } = await supabase
      .from("meal_planning")
      .update({ daysEaten: newDaysEaten })
      .eq("id", id);

    if (error) {
      console.error("Error while updating daysEaten: ", error);
      alert("Error while updating daysEaten");
    } else {
      setPlannedItems((prevItems) =>
        prevItems.map((item) =>
          item.id === id ? { ...item, daysEaten: newDaysEaten } : item
        )
      );
    }
  }

  function showRateRecipeModal(recipeId: number) {
    setRecipeToRate(recipeId);
    ratingModalRef.current?.open();
  }

  function goToPreviousWeek() {
    setCurrentWeek((prevWeek) => subWeeks(prevWeek, 1));
  }

  function goToNextWeek() {
    setCurrentWeek((prevWeek) => addWeeks(prevWeek, 1));
  }

  function goToCurrentWeek() {
    setCurrentWeek(new Date());
  }

  function getMealPlannerItemsByPlannedDate(
    plannedDate: Date
  ): MealPlannerItemType[] {
    return plannedItems.filter((item) => {
      return (
        item.planned_date !== null && isSameDay(item.planned_date, plannedDate)
      );
    });
  }

  function getNotPlannedItems(): MealPlannerItemType[] {
    return plannedItems.filter((item) => {
      return item.planned_date === null && item.daysEaten < item.days;
    });
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const item = plannedItems.find((i) => i.id === active.id);
    if (item) {
      setActiveItem({ ...item });
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;

    // Open drawer when hovering over the no-date drop zone
    if (over?.id === "no-date-zone") {
      setIsDrawerOpen(true);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { over } = event;
    const draggedItem = activeItem;

    if (!over || !draggedItem) {
      setActiveItem(null);
      return;
    }

    const targetDateStr = over.id as string;

    if (targetDateStr === "no-date-zone") {
      if (draggedItem.planned_date === null) {
        setActiveItem(null);
        return;
      }

      setPlannedItems((items) =>
        items.map((item) =>
          item.id === draggedItem.id ? { ...item, planned_date: null } : item
        )
      );

      updatePlannedItemDate(draggedItem.id, null, 1);
      setActiveItem(null);
      // Drawer stays open since we just added an item
      return;
    }

    const targetDate = new Date(targetDateStr);

    if (
      draggedItem.planned_date &&
      isSameDay(draggedItem.planned_date, targetDate)
    ) {
      setActiveItem(null);
      return;
    }

    // Check if dragging from drawer and it will be empty after
    const isDraggingFromDrawer = draggedItem.planned_date === null;
    if (isDraggingFromDrawer) {
      const remainingUnplannedItems = getNotPlannedItems().filter(
        (item) => item.id !== draggedItem.id
      );
      if (remainingUnplannedItems.length === 0) {
        setIsDrawerOpen(false);
      }
    }

    setPlannedItems((items) =>
      items.map((item) =>
        item.id === draggedItem.id
          ? { ...item, planned_date: targetDate }
          : item
      )
    );

    updatePlannedItemDate(draggedItem.id, targetDate, draggedItem.days);
    setActiveItem(null);
  }

  function handleDragCancel() {
    setActiveItem(null);
  }

  function renderMealPlannerItem(item: MealPlannerItemType) {
    return (
      <MealPlannerItem
        key={item.id}
        id={item.id}
        recipeId={item.recipeId}
        recipeName={item.recipeName}
        date={item.planned_date}
        days={item.days}
        daysEaten={item.daysEaten}
        setDaysEaten={(days) => setDaysEaten(item.id, days)}
        onRecipeEaten={() => {
          setDaysEaten(item.id, item.daysEaten + 1);
          showRateRecipeModal(item.recipeId);
        }}
        onRecipeDelete={() => deletePlannedItem(item.id)}
        onUpdateToNoDate={() => updatePlannedItemDate(item.id, null, 1)}
        isDragging={activeItem?.id === item.id}
      />
    );
  }

  function renderCorrectItem(plannedDate: Date) {
    const items = getMealPlannerItemsByPlannedDate(plannedDate);

    if (items.length > 0) {
      return (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>{renderMealPlannerItem(item)}</li>
          ))}
        </ul>
      );
    }

    return <MealPlannerAdd onClick={() => navigate("/cookbook")} />;
  }

  const notPlannedItems = getNotPlannedItems();
  const isDraggingFromDrawer = activeItem?.planned_date === null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      modifiers={[restrictToVerticalAxisAndWindow]}
      autoScroll={{
        threshold: {
          x: 0,
          y: 0.15,
        },
        layoutShiftCompensation: false,
      }}
    >
      <Layout>
        <RatingModal
          showTriggerButton={false}
          ref={ratingModalRef}
          recipeId={recipeToRate}
        />

        {/* Week Navigation */}
        <div className="sticky flex items-center justify-between px-2 py-1 border-b bg-background top-11 z-10">
          <Button variant="ghost" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft size={20} />
          </Button>

          <div className="flex flex-col items-center">
            <h2 className="text-lg font-semibold">
              {isSameWeek(currentWeek, new Date())
                ? "Diese Woche"
                : isSameWeek(currentWeek, addWeeks(new Date(), 1))
                ? "Nächste Woche"
                : isSameWeek(currentWeek, subWeeks(new Date(), 1))
                ? "Letzte Woche"
                : `${format(getWeekdays(currentWeek)[0], "dd.MM")} - ${format(
                    getWeekdays(currentWeek)[6],
                    "dd.MM"
                  )}`}
            </h2>

            {!isSameWeek(currentWeek, new Date()) && (
              <Button
                variant="link"
                size="sm"
                onClick={goToCurrentWeek}
                className="h-auto p-0 text-xs text-muted-foreground"
              >
                Zur aktuellen Woche
              </Button>
            )}

            {isSameWeek(currentWeek, new Date()) && (
              <div className="h-[16px]"></div>
            )}
          </div>

          <Button variant="ghost" size="sm" onClick={goToNextWeek}>
            <ChevronRight size={20} />
          </Button>
        </div>

        {/* Calendar Days */}
        <div className="flex flex-col gap-2.5 mb-64 p-2">
          {getWeekdays(currentWeek).map((day) => {
            const dayStr = day.toISOString();
            return (
              <DroppableDay key={dayStr} id={dayStr}>
                <p
                  className={
                    "px-2 mb-1 font-semibold rounded-full w-fit " +
                    (isToday(day) ? "bg-accent " : "")
                  }
                >
                  {format(day, "EEE - dd.MM", {
                    locale:
                      locales[i18n.language as keyof typeof locales] || enUS,
                  })}
                </p>

                {renderCorrectItem(day)}
              </DroppableDay>
            );
          })}
        </div>

        {/* Bottom Drawer */}
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-background border-t">
          {/* Show drop zone when dragging from calendar */}
          {activeItem && !isDraggingFromDrawer && (
            <DroppableNoDateZone>
              <div className="flex items-center justify-center gap-2 p-4 text-muted-foreground">
                <CalendarOff size={20} />
                <span>{t("mealPlanner.dropToRemoveDate")}</span>
              </div>
            </DroppableNoDateZone>
          )}

          {/* Show drawer header and content when not dragging from calendar */}
          {(!activeItem || isDraggingFromDrawer) && (
            <>
              {/* Drawer Header */}
              <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CalendarOff size={20} />
                  <span className="font-medium">
                    Ohne Datum - {notPlannedItems.length}
                  </span>
                </div>
                <ChevronDown
                  size={20}
                  className={`transition-transform duration-200 ${
                    isDrawerOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Drawer Content - Always mounted, visibility controlled by CSS */}
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isDrawerOpen ? "max-h-[200px]" : "max-h-0"
                }`}
              >
                <div className="p-2">
                  {notPlannedItems.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {notPlannedItems.map((item) => (
                        <div key={item.id} className="flex-shrink-0 w-[280px]">
                          {renderMealPlannerItem(item)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      {t("mealPlanner.noUnplannedItems")}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </Layout>

      <DragOverlay
        dropAnimation={{
          duration: 200,
          easing: "ease",
        }}
      >
        {activeItem && (
          <Card className="h-[90px] flex items-center shadow-2xl opacity-95 border-2 border-primary">
            <div className="h-full w-[74px] bg-muted border-r-4 border-background" />
            <div className="flex-1 px-2.5">
              <p className="second-font text-md font-semibold break-words leading-tight line-clamp-3">
                {activeItem.recipeName}
              </p>
            </div>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function DroppableDay({
  id,
  children,
}: Readonly<{
  id: string;
  children: React.ReactNode;
}>) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`transition-colors rounded-lg p-1 min-h-[50px] ${
        isOver ? "bg-accent ring-2 ring-primary" : ""
      }`}
    >
      {children}
    </div>
  );
}

function DroppableNoDateZone({
  children,
}: Readonly<{
  children?: React.ReactNode;
}>) {
  const { isOver, setNodeRef } = useDroppable({
    id: "no-date-zone",
  });

  return (
    <div
      ref={setNodeRef}
      className={`transition-colors ${isOver ? "bg-accent" : "bg-background"}`}
    >
      {children}
    </div>
  );
}
