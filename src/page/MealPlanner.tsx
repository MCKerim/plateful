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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { CalendarOff, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
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

type MealPlannerItem = {
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

  const [plannedItems, setPlannedItems] = useState<MealPlannerItem[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Store the full active item data, not just the ID
  const [activeItem, setActiveItem] = useState<MealPlannerItem | null>(null);

  const [accordionValue, setAccordionValue] = useState<string>("item-1");
  const previousAccordionValue = useRef<string>("item-1");

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

    const newItems: MealPlannerItem[] = [];

    if (!data) {
      setPlannedItems(newItems);
      return;
    }

    data.forEach((item) => {
      const newItem: MealPlannerItem = {
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
      // Refetch to restore correct state on error
      getMealPlannerItems();
    } else {
      toast.success(t("recipe.planningSuccessful"), {
        position: "top-right",
        richColors: true,
      });
      // Refetch to ensure consistency
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
  ): MealPlannerItem[] {
    return plannedItems.filter((item) => {
      return (
        item.planned_date !== null && isSameDay(item.planned_date, plannedDate)
      );
    });
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;

    // Find and store the complete item data
    const item = plannedItems.find((i) => i.id === active.id);
    if (item) {
      // Create a copy of the item to prevent issues if plannedItems updates
      setActiveItem({ ...item });
    }

    previousAccordionValue.current = accordionValue;
    setAccordionValue("");
  }

  function handleDragEnd(event: DragEndEvent) {
    const { over } = event; // Removed 'active' since we use activeItem instead

    // Always clear active item at the end
    const draggedItem = activeItem;

    if (!over || !draggedItem) {
      setActiveItem(null);
      setAccordionValue(previousAccordionValue.current);
      return;
    }

    const targetDateStr = over.id as string;

    if (targetDateStr === "no-date-zone") {
      if (draggedItem.planned_date === null) {
        setActiveItem(null);
        setAccordionValue(previousAccordionValue.current);
        return;
      }

      // Optimistic update
      setPlannedItems((items) =>
        items.map((item) =>
          item.id === draggedItem.id ? { ...item, planned_date: null } : item
        )
      );

      updatePlannedItemDate(draggedItem.id, null, 1);
      setActiveItem(null);
      setAccordionValue(previousAccordionValue.current);
      return;
    }

    const targetDate = new Date(targetDateStr);

    if (
      draggedItem.planned_date &&
      isSameDay(draggedItem.planned_date, targetDate)
    ) {
      setActiveItem(null);
      setAccordionValue(previousAccordionValue.current);
      return;
    }

    // Optimistic update
    setPlannedItems((items) =>
      items.map((item) =>
        item.id === draggedItem.id
          ? { ...item, planned_date: targetDate }
          : item
      )
    );

    updatePlannedItemDate(draggedItem.id, targetDate, draggedItem.days);
    setActiveItem(null);
    setAccordionValue(previousAccordionValue.current);
  }

  function handleDragCancel() {
    // Removed unused 'event' parameter
    // Reset everything on cancel
    setActiveItem(null);
    setAccordionValue(previousAccordionValue.current);
  }

  function renderCorrectItem(plannedDate: Date) {
    const items = getMealPlannerItemsByPlannedDate(plannedDate);

    if (items.length > 0) {
      return (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <MealPlannerItem
              key={item.id}
              id={item.id}
              recipeId={item.recipeId}
              recipeName={item.recipeName}
              date={item.planned_date}
              days={item.days}
              daysEaten={item.daysEaten}
              setDaysEaten={(days) => setDaysEaten(item.id, days)}
              onRecipeEaten={(id) => {
                setDaysEaten(id, item.daysEaten + 1);
                showRateRecipeModal(item.recipeId);
              }}
              onRecipeDelete={(id) => deletePlannedItem(id)}
              onUpdateToNoDate={(id) => updatePlannedItemDate(id, null, 1)}
              isDragging={activeItem?.id === item.id}
            />
          ))}
        </ul>
      );
    }

    return <MealPlannerAdd onClick={() => navigate("/cookbook")} />;
  }

  function getNotPlannedItems(): MealPlannerItem[] {
    return plannedItems.filter((item) => {
      return item.planned_date === null && item.daysEaten < item.days;
    });
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
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
        <div className="sticky flex items-center justify-between px-2 py-1 border-b bg-background top-11">
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

        <div className="flex flex-col gap-2.5 mb-64">
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

        {activeItem ? (
          <DroppableNoDateZone isMinimal>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <CalendarOff size={20} />
              <span>{t("mealPlanner.dropToRemoveDate")}</span>
            </div>
          </DroppableNoDateZone>
        ) : (
          <Accordion
            type="single"
            value={accordionValue}
            onValueChange={setAccordionValue}
            collapsible
            className="fixed w-full bg-background bottom-16"
          >
            <AccordionItem value="item-1">
              <AccordionTrigger>
                <div className="flex items-center gap-1">
                  <CalendarOff size={20} /> Ohne Datum -{" "}
                  {getNotPlannedItems().length}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <DroppableNoDateZone>
                  <div className="flex gap-3 overflow-x-auto pb-2 px-1">
                    {getNotPlannedItems().map((item) => (
                      <div key={item.id} className="flex-shrink-0 w-[280px]">
                        <MealPlannerItem
                          key={item.id}
                          id={item.id}
                          recipeId={item.recipeId}
                          recipeName={item.recipeName}
                          date={item.planned_date}
                          days={item.days}
                          daysEaten={item.daysEaten}
                          setDaysEaten={(days) => setDaysEaten(item.id, days)}
                          onRecipeEaten={(id) => {
                            setDaysEaten(id, item.daysEaten + 1);
                            showRateRecipeModal(item.recipeId);
                          }}
                          onRecipeDelete={deletePlannedItem}
                          onUpdateToNoDate={(id) =>
                            updatePlannedItemDate(id, null, 1)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </DroppableNoDateZone>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </Layout>

      {/* DragOverlay now uses stored activeItem data - won't break when original unmounts */}
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
      className={`transition-colors rounded-lg p-1 ${
        isOver ? "bg-accent" : ""
      }`}
    >
      {children}
    </div>
  );
}

function DroppableNoDateZone({
  children,
  isMinimal = false,
}: Readonly<{
  children?: React.ReactNode;
  isMinimal?: boolean;
}>) {
  const { isOver, setNodeRef } = useDroppable({
    id: "no-date-zone",
  });

  if (isMinimal) {
    return (
      <div
        ref={setNodeRef}
        className={`fixed bottom-16 left-0 right-0 z-50 p-4 transition-colors border-t-2 ${
          isOver
            ? "bg-accent border-primary"
            : "bg-background border-transparent"
        }`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`transition-colors rounded-lg min-h-[100px] ${
        isOver ? "bg-accent" : ""
      }`}
    >
      {children}
    </div>
  );
}
