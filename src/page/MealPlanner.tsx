import MealPlannerItem from "@/components/atoms/MealPlannerItem";
import Layout from "@/components/layout/Layout";
import { useEffect, useState } from "react";
import supabase from "@/utils/supabase";

type MealPlannerItem = {
  id: number;
  recipeName: string;
  date: string;
};

export default function MealPlanner() {
  const [plannedItems, setPlannedItems] = useState<MealPlannerItem[]>([]);

  useEffect(() => {
    getMealPlannerItems();
  }, []);

  async function getMealPlannerItems() {
    const { data } = await supabase.from("meal_planning").select(
      `
        id,
        planned_date,
        recipes (id, name)
      `
    );

    const newItems: MealPlannerItem[] = [];

    if (!data) {
      setPlannedItems(newItems);
      return;
    }

    data.forEach((item) => {
      const newItem: MealPlannerItem = {
        id: item.recipes?.id ?? 1,
        date: item.planned_date ?? "no date",
        recipeName: item.recipes?.name ?? "no name",
      };
      newItems.push(newItem);
    });
    setPlannedItems(newItems);
  }

  return (
    <Layout>
      <h1 className="text-2xl">Meal Planner</h1>
      {plannedItems.map((item) => (
        <MealPlannerItem
          key={item.id}
          id={item.id}
          recipeName={item.recipeName}
          date={item.date}
        />
      ))}
    </Layout>
  );
}
