import MealPlannerItem from "@/components/atoms/MealPlannerItem";
import Layout from "@/components/layout/Layout";
import { useEffect, useState } from "react";
import supabase from "@/utils/supabase";
import { Separator } from "../components/ui/separator";
import { format, eachDayOfInterval } from "date-fns";

type MealPlannerItem = {
  id: number;
  recipeId: number;
  recipeName: string;
  date: Date;
  days: number;
};

export default function MealPlanner() {
  const [plannedItems, setPlannedItems] = useState<MealPlannerItem[]>([]);

  useEffect(() => {
    getMealPlannerItems();
  }, []);

  async function getMealPlannerItems() {
    const { data } = await supabase
      .from("meal_planning")
      .select(
        `
        id,
        planned_date,
        days,
        recipes (id, name)
      `
      )
      .order("planned_date", { ascending: true });

    const newItems: MealPlannerItem[] = [];

    if (!data) {
      setPlannedItems(newItems);
      return;
    }

    data.forEach((item) => {
      const newItem: MealPlannerItem = {
        id: item.id,
        recipeId: item.recipes?.id ?? 1,
        date: new Date(item.planned_date ?? ""),
        recipeName: item.recipes?.name ?? "no name",
        days: item.days,
      };
      newItems.push(newItem);
    });

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 3);

    setPlannedItems(newItems.filter((item) => item.date >= twoDaysAgo));
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
    newDate: Date,
    newDays: number
  ) {
    const { error } = await supabase
      .from("meal_planning")
      .update({ planned_date: newDate.toISOString(), days: newDays })
      .eq("id", id);

    if (error) {
      console.error("Error while updating planned item date: ", error);
      alert("Error while updating planned item date");
    } else {
      getMealPlannerItems();
    }
  }

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 10);

  const allDates = eachDayOfInterval({ start: twoDaysAgo, end: nextWeek });

  const groupedItems = allDates.reduce((acc, date) => {
    const dateKey = format(date, "EEEE • dd.MM.yyyy");
    acc[dateKey] = plannedItems.filter(
      (item) => format(item.date, "EEEE • dd.MM.yyyy") === dateKey
    );
    return acc;
  }, {} as Record<string, MealPlannerItem[]>);

  return (
    <Layout>
      <h1 className="text-2xl">Meal Planner</h1>

      {Object.keys(groupedItems).map((dateKey, index) => (
        <div key={index} className="flex gap-2 flex-col">
          <p
            className={
              (dateKey === format(new Date(), "EEEE • dd.MM.yyyy") &&
                "bg-gray-700 rounded-sm ") + "px-2"
            }
          >
            {dateKey}
          </p>

          <Separator />

          {groupedItems[dateKey].length > 0 ? (
            groupedItems[dateKey].map((item) => (
              <MealPlannerItem
                key={item.id}
                id={item.id}
                recipeId={item.recipeId}
                recipeName={item.recipeName}
                date={item.date}
                days={item.days}
                onDelete={deletePlannedItem}
                onUpdateDate={updatePlannedItemDate}
              />
            ))
          ) : (
            <p>-</p>
          )}
        </div>
      ))}
    </Layout>
  );
}
