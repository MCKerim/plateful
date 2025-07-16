import MealPlannerItem from "@/components/atoms/MealPlannerItem";
import Layout from "@/components/layout/Layout";
import { useEffect, useRef, useState } from "react";
import supabase from "@/utils/supabase";
import { Separator } from "../components/ui/separator";
import { format, addDays } from "date-fns";
import { useTranslation } from "react-i18next";
import { de, enUS } from "date-fns/locale";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import RatingModal, { RatingModalRef } from "@/components/atoms/RatingModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import Rive from "@rive-app/react-canvas";

type MealPlannerItem = {
  id: number;
  recipeId: number;
  recipeName: string;
  date: Date;
  days: number;
  daysEaten: number;
};

export default function MealPlanner() {
  const { t, i18n } = useTranslation();

  const [plannedItems, setPlannedItems] = useState<MealPlannerItem[]>([]);
  const [loading, setLoading] = useState(true);

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
        date: new Date(item.planned_date ?? ""),
        recipeName: item.recipes?.name ?? "no name",
        days: item.days,
        daysEaten: item.daysEaten,
      };
      newItems.push(newItem);
    });

    //const twoDaysAgo = new Date();
    //twoDaysAgo.setDate(twoDaysAgo.getDate() - 3);
    //.filter((item) => item.date >= twoDaysAgo)

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

  function plannedDays() {
    const sumDaysPlanned = plannedItems.reduce(
      (accumulator, currentItem) => accumulator + currentItem.days,
      0
    );

    const sumDaysEaten = plannedItems.reduce(
      (accumulator, currentItem) => accumulator + currentItem.daysEaten,
      0
    );

    return sumDaysPlanned - sumDaysEaten;
  }

  function getPlannedRangeFormatted() {
    const currentLanguage = i18n.language;
    const locale = currentLanguage === "de" ? de : enUS;

    return `${format(new Date(), "EEEE, dd.MM", { locale })} - ${format(
      addDays(new Date(), plannedDays()),
      "EEEE, dd.MM",
      { locale }
    )}`;
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

  return (
    <Layout>
      <RatingModal
        showTriggerButton={false}
        ref={ratingModalRef}
        recipeId={recipeToRate}
      />

      {plannedItems.filter((item) => {
        return item.days > item.daysEaten;
      }).length > 0 && (
        <>
          <p className="w-full text-center">
            {t("dayWithCount", { count: plannedDays() })} •{" "}
            {getPlannedRangeFormatted()}
          </p>

          <Separator />
        </>
      )}

      <div className="flex flex-col gap-2.5">
        {loading && (
          <>
            {[...Array(4)].map((_, i) => (
              <div
                className="w-full max-w-lg h-[90px] flex"
                key={`skeleton_${i}`}
              >
                <Skeleton className="min-w-[70px] mr-1 h-full rounded-l-lg rounded-r-none" />

                <Skeleton className="w-[100%] h-full rounded-r-lg rounded-l-none mb-1" />
              </div>
            ))}
          </>
        )}

        {!loading &&
          plannedItems.filter((item) => {
            return item.days > item.daysEaten;
          }).length === 0 && (
            <div className="w-full flex flex-col justify-center items-center mt-10 gap-2">
              <div className="w-full h-[80px] mx-auto">
                <Rive src="/plateful-character.riv" artboard="Sad" />
              </div>

              <p className="flex justify-center font-bold">
                Keine Rezepte geplant...
              </p>
            </div>
          )}

        {plannedItems
          .filter((item) => {
            return item.days > item.daysEaten;
          })
          .map((item) => (
            <MealPlannerItem
              key={item.id}
              id={item.id}
              recipeId={item.recipeId}
              recipeName={item.recipeName}
              date={item.date}
              days={item.days}
              daysEaten={item.daysEaten}
              setDaysEaten={(days) => setDaysEaten(item.id, days)}
              onDeleteDate={deletePlannedItem}
              onUpdateDate={updatePlannedItemDate}
              onRecipeEaten={showRateRecipeModal}
            />
          ))}
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>{t("mealPlanner.alreadyEaten")}</AccordionTrigger>

          <AccordionContent className="flex flex-col gap-2.5">
            {plannedItems
              .filter((item) => {
                return item.days <= item.daysEaten;
              })
              .reverse()
              .slice(0, 10)
              .map((item) => (
                <MealPlannerItem
                  key={item.id}
                  id={item.id}
                  recipeId={item.recipeId}
                  recipeName={item.recipeName}
                  date={item.date}
                  days={item.days}
                  daysEaten={item.daysEaten}
                  setDaysEaten={(days) => setDaysEaten(item.id, days)}
                  onDeleteDate={deletePlannedItem}
                  onUpdateDate={updatePlannedItemDate}
                  onRecipeEaten={showRateRecipeModal}
                />
              ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Layout>
  );
}
