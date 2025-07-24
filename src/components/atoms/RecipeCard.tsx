import { NavLink } from "react-router";
import { Card } from "../ui/card";
import StarIcon from "@mui/icons-material/Star";
import TagPill from "./TagPill";
import { CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import supabase from "@/utils/supabase";
import { MealPlanning } from "@/types/exportedDatabaseTypes.types";
import { getMealPlanStatus } from "@/lib/mealPlanHelper";

type Props = {
  id: number;
  name: string;
};

export default function RecipeCard({ id, name }: Readonly<Props>) {
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [lastMealPlan, setLastMealPlan] = useState<MealPlanning | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const TAGS: string[] = [];

  useEffect(() => {
    supabase
      .from("recipe_ratings")
      .select("stars")
      .eq("recipe_id", id)
      .then((response) => {
        if (response.data) {
          const totalStars = response.data.reduce(
            (acc, rating) => acc + rating.stars,
            0
          );
          setAverageRating(totalStars / response.data.length);
        }
      });
  }, [id]);

  useEffect(() => {
    async function getMealPlanningInfo() {
      const { data } = await supabase
        .from("meal_planning")
        .select("*")
        .eq("recipe_id", id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const latestPlan = data[0];
        setLastMealPlan(latestPlan);
      } else {
        setLastMealPlan(null);
      }
    }

    getMealPlanningInfo();
  }, [id]);

  useEffect(() => {
    async function fetchImage() {
      const { data, error } = await supabase.storage
        .from("recipeimages")
        .list(`recipe_${id}/`);
      if (!error && data && data.length > 0) {
        const { data: signedUrlData } = await supabase.storage
          .from("recipeimages")
          .createSignedUrl(`recipe_${id}/${data[0].name}`, 3600);
        setImageUrl(signedUrlData?.signedUrl || null);
      } else {
        setImageUrl(null);
      }
    }
    fetchImage();
  }, [id]);

  function renderTagPills() {
    return TAGS.map((tag, index) => (
      <TagPill key={index} name={tag} color="green" />
    ));
  }

  return (
    <NavLink to={`/recipe/${id}`} className="w-full">
      <Card className="relative">
        <img
          src={imageUrl || "/no-img.jpg"}
          alt="Recipe"
          className="object-cover w-full h-32 border-b-4 border-background dark:brightness-75"
        />

        <div className="flex flex-col justify-between gap-2 p-2">
          <div className="flex justify-between">
            <h1 className="font-bold leading-tight text-md line-clamp-2">
              {name}
            </h1>
          </div>

          {TAGS.length > 0 && (
            <div className="flex gap-1">{renderTagPills()}</div>
          )}

          <div className="flex justify-between">
            <div className="flex items-center gap-1">
              <CalendarDays size={16} />

              <p className="text-xs">{getMealPlanStatus(lastMealPlan)}</p>
            </div>

            <div className="flex items-center">
              <p className="text-xs">{averageRating || "-"}</p>

              <StarIcon style={{ fontSize: "16px" }} />
            </div>
          </div>
        </div>
      </Card>
    </NavLink>
  );
}
