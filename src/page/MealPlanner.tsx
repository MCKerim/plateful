import MealPlannerItem from "@/components/atoms/MealPlannerItem";
import Layout from "@/components/layout/Layout";
import { useEffect, useState } from "react";
import supabase from "@/utils/supabase";
import { Separator } from "../components/ui/separator";
import { format, addDays } from "date-fns";
import { useTranslation } from "react-i18next";
import { de, enUS } from "date-fns/locale";

type MealPlannerItem = {
  id: number;
  recipeId: number;
  recipeName: string;
  date: Date;
  days: number;
};

export default function MealPlanner() {
  const [plannedItems, setPlannedItems] = useState<MealPlannerItem[]>([]);

  const { t, i18n } = useTranslation();

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

  function plannedDays() {
    const initialValue = 0;
    const sumWithInitial = plannedItems.reduce(
      (accumulator, currentItem) => accumulator + currentItem.days,
      initialValue
    );

    return sumWithInitial;
  }

  function getPlannedRangeFormatted() {
    const currentLanguage = i18n.language;
    const locale = currentLanguage === "de" ? de : enUS;

    return `${format(new Date(), "EEEE, dd.MM.yyyy", { locale })} - ${format(
      addDays(new Date(), plannedDays()),
      "EEEE, dd.MM.yyyy",
      { locale }
    )}`;
  }

  return (
    <Layout>
      <h1 className="text-2xl">{t("mealPlanner.title")} • {t("dayWithCount", { count: plannedDays() })}</h1>

      <div className="flex gap-2 flex-col">
        <p className="w-full text-center">{getPlannedRangeFormatted()}</p>

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
          onDeleteDate={deletePlannedItem}
          onUpdateDate={updatePlannedItemDate}
        />
      ))}
    </Layout>
  );
}
