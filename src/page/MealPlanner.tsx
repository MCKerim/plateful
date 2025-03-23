import MealPlannerItem from "@/components/atoms/MealPlannerItem";
import Layout from "@/components/layout/Layout";
import { useEffect, useState } from "react";
import supabase from "@/utils/supabase";
import { Separator } from "../components/ui/separator";
import { format } from "date-fns";

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

    //const twoDaysAgo = new Date();
    //twoDaysAgo.setDate(twoDaysAgo.getDate() - 3);
    //.filter((item) => item.date >= twoDaysAgo)

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

  return (
    <Layout>
      <h1 className="text-2xl">Meal Planner</h1>

      <div className="flex gap-2 flex-col">
        <p>Today • {format(new Date(), "EEEE • dd.MM.yyyy")}</p>
        <Separator />
      </div>

      {plannedItems.map((item) => (
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
      ))}
    </Layout>
  );
}
