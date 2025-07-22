import { NavLink } from "react-router";
import { Card } from "../ui/card";
import StarIcon from "@mui/icons-material/Star";
import StarHalfIcon from "@mui/icons-material/StarHalf";
import StarBorderIcon from "@mui/icons-material/StarBorder";
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

  function renderStars() {
    const stars = [];

    const starStyles = {
      fontSize: "16px",
    };

    for (let i = 0; i < 5; i++) {
      if (averageRating === null) {
        stars.push(<StarBorderIcon key={i} style={starStyles} />);
        continue;
      }

      if (i < Math.floor(averageRating)) {
        stars.push(<StarIcon key={i} style={starStyles} />);
      } else if (i < averageRating) {
        stars.push(<StarHalfIcon key={i} style={starStyles} />);
      } else {
        stars.push(<StarBorderIcon key={i} style={starStyles} />);
      }
    }
    return stars;
  }

  function renderTagPills() {
    const tags: string[] = [];
    return tags.map((tag, index) => (
      <TagPill key={index} name={tag} color="green" />
    ));
  }

  return (
    <NavLink to={`/recipe/${id}`} className="w-full">
      <Card className="relative">
        <img
          src={imageUrl || "/no-img.jpg"}
          alt="Recipe"
          className="h-32 w-full object-cover border-b-4 border-background dark:brightness-75"
        />

        <div className="p-2">
          <div className="flex justify-end">
            <div className="flex gap-1 absolute top-1 bg-card rounded-full px-1 py-[1px]">
              {renderStars()}
            </div>
          </div>

          <div className="flex justify-between">
            <h1 className="font-bold text-md leading-tight line-clamp-2">
              {name}
            </h1>
          </div>

          <div className="flex justify-between mt-2">
            <div className="flex gap-1">{renderTagPills()}</div>

            <div className="flex gap-1 items-center">
              <p className="italic text-xs">
                {getMealPlanStatus(lastMealPlan)}
              </p>

              <CalendarDays size={16} />
            </div>
          </div>
        </div>
      </Card>
    </NavLink>
  );
}
