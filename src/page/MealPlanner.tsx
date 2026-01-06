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

type MealPlannerItem = {
  id: number;
  recipeId: number;
  recipeName: string;
  planned_date: Date | null;
  days: number;
  daysEaten: number;
};

export default function MealPlanner() {
  const { supabase } = useSupabase();
  const navigate = useNavigate();

  const [plannedItems, setPlannedItems] = useState<MealPlannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [dropTargetDate, setDropTargetDate] = useState<Date | null>(null);

  const ratingModalRef = useRef<RatingModalRef>(null);
  const [recipeToRate, setRecipeToRate] = useState<number>();

  useEffect(() => {
    getMealPlannerItems();
  }, []);

  async function getMealPlannerItems() {
    setLoading(true);

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
      setLoading(false);
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
    setLoading(false);
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
    const { error } = await supabase
      .from("meal_planning")
      .update({ planned_date: newDate?.toISOString(), days: newDays })
      .eq("id", id);

    if (error) {
      console.error("Error while updating planned item date: ", error);
      alert("Error while updating planned item date");
    } else {
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

  function getMealPlannerItemByPlannedDate(plannedDate: Date) {
    return plannedItems.find(
      (item) => item.planned_date && isSameDay(item.planned_date, plannedDate)
    );
  }

  // Drag and Drop Handlers
  function handleDragStart(itemId: number) {
    setDraggedItemId(itemId);
    console.log("Drag started for item:", itemId);
  }

  function handleDragOver(e: React.DragEvent, targetDate: Date) {
    e.preventDefault();
    setDropTargetDate(targetDate);
  }

  function handleDragLeave() {
    setDropTargetDate(null);
  }

  function handleDrop(e: React.DragEvent, targetDate: Date) {
    e.preventDefault();
    setDropTargetDate(null);

    if (draggedItemId === null) return;

    const draggedItem = plannedItems.find((item) => item.id === draggedItemId);
    if (!draggedItem) return;

    console.log("Dropped item:", draggedItem.recipeName);
    console.log("Target date:", format(targetDate, "EEE - dd.MM.yyyy"));

    updatePlannedItemDate(draggedItemId, targetDate, draggedItem.days);
    setDraggedItemId(null);
  }

  function handleDragEnd() {
    setDraggedItemId(null);
    setDropTargetDate(null);
  }

  function renderCorrectItem(plannedDate: Date) {
    const item = getMealPlannerItemByPlannedDate(plannedDate);

    if (item) {
      return (
        <MealPlannerItem
          id={item.id}
          recipeId={item.recipeId}
          recipeName={item.recipeName}
          date={item.planned_date}
          days={item.days}
          daysEaten={item.daysEaten}
          setDaysEaten={(days) => setDaysEaten(item.id, days)}
          onUpdateDate={(id, newDate, newDays) =>
            updatePlannedItemDate(id, newDate, newDays)
          }
          onRecipeEaten={(id) => {
            setDaysEaten(id, item.daysEaten + 1);
            showRateRecipeModal(item.recipeId);
          }}
          onRecipeDelete={(id) => deletePlannedItem(id)}
          onDragStart={() => handleDragStart(item.id)}
          onDragEnd={handleDragEnd}
        />
      );
    }

    return <MealPlannerAdd onClick={() => navigate("/cookbook")} />;
  }

  function getNotPlannedItems() {
    return plannedItems.filter((item) => {
      return item.planned_date === null && item.daysEaten < item.days;
    });
  }

  return (
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

      <div className="flex flex-col gap-2.5 mb-32">
        {getWeekdays(currentWeek).map((day) => (
          <div
            key={format(day, "EEE - dd.MM")}
            onDragOver={(e) => handleDragOver(e, day)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, day)}
            className={`transition-colors ${
              dropTargetDate && isSameDay(dropTargetDate, day)
                ? "bg-accent rounded-lg"
                : ""
            }`}
          >
            <p
              className={
                "px-2 mb-1 font-semibold rounded-full w-fit " +
                (isToday(day) ? "bg-accent " : "")
              }
            >
              {format(day, "EEE - dd.MM")}
            </p>

            {renderCorrectItem(day)}
          </div>
        ))}
      </div>

      <Accordion
        type="single"
        defaultValue="item-1"
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

          <AccordionContent className="flex gap-3 py-2 overflow-x-auto no-scrollbar">
            {getNotPlannedItems().map((item) => (
              <div key={item.id} className="min-w-[400px]">
                <MealPlannerItem
                  id={item.id}
                  recipeId={item.recipeId}
                  recipeName={item.recipeName}
                  date={item.planned_date}
                  days={item.days}
                  daysEaten={item.daysEaten}
                  setDaysEaten={(days) => setDaysEaten(item.id, days)}
                  onUpdateDate={(id, newDate, newDays) =>
                    updatePlannedItemDate(id, newDate, newDays)
                  }
                  onRecipeEaten={(id) => {
                    setDaysEaten(id, item.daysEaten + 1);
                    showRateRecipeModal(item.recipeId);
                  }}
                  onRecipeDelete={deletePlannedItem}
                  onDragStart={() => handleDragStart(item.id)}
                  onDragEnd={handleDragEnd}
                />
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Layout>
  );
}
