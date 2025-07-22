import { NavLink } from "react-router";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import NoMealsIcon from "@mui/icons-material/NoMeals";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import supabase from "@/utils/supabase";
import { useEffect, useState } from "react";

type Props = {
  id: number;
  recipeId: number;
  recipeName: string;
  date: Date | null;
  days: number;
  daysEaten: number;
  setDaysEaten: (days: number) => void;
  onDeleteDate: (id: number) => void;
  onUpdateDate: (id: number, newDate: Date | null, newDays: number) => void;
  onRecipeEaten: (id: number) => void;
};

export default function MealPlannerItem({
  recipeId,
  recipeName,
  days,
  daysEaten,
  setDaysEaten,
  onRecipeEaten,
}: Readonly<Props>) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchImage() {
      const { data, error } = await supabase.storage
        .from("recipeimages")
        .list(`recipe_${recipeId}/`);

      if (error) {
        console.error("Error fetching images: ", error);
        return;
      }

      if (data && data.length > 0) {
        const { data: signedUrlData, error: signedUrlError } =
          await supabase.storage
            .from("recipeimages")
            .createSignedUrl(`recipe_${recipeId}/${data[0].name}`, 3600);

        if (signedUrlError) {
          console.error("Error creating signed URL: ", signedUrlError);
          return;
        }

        setImageUrl(signedUrlData?.signedUrl || null);
      }
    }

    fetchImage();
  }, [recipeId]);

  function eat() {
    if (daysEaten + 1 > days) {
      setDaysEaten(0);
    } else {
      const updatedDaysEaten = daysEaten + 1;
      setDaysEaten(updatedDaysEaten);

      if (updatedDaysEaten >= days) {
        onRecipeEaten(recipeId);
      }
    }
  }

  return (
    <Card className="h-[90px] flex items-center">
      <img
        src={
          imageUrl || "/no-img.jpg"
        }
        alt="Spaghetti"
        className="h-full w-[74px] object-cover border-r-4 border-background dark:brightness-75"
      />

      <NavLink
        className="flex-1 text-lg font-semibold px-2.5"
        to={`/recipe/${recipeId}`}
      >
        {recipeName}
      </NavLink>

      <Button
        className="flex gap-2 items-center me-2.5"
        variant="outline"
        onClick={eat}
      >
        {Array.from({ length: days }, (_, index) => (
          <>
            {index < daysEaten ? (
              <NoMealsIcon style={{ fontSize: 24 }} />
            ) : (
              <RestaurantIcon style={{ fontSize: 24 }} />
            )}

            {index < days - 1 && (
              <span className="h-full border-r-2 rounded-full border-foreground"></span>
            )}
          </>
        ))}

        {/*<PlanDialog
            isEdit
            id={id}
            initialDays={days}
            onUpdateDate={onUpdateDate}
            onDeleteDate={onDeleteDate}
          />*/}
      </Button>
    </Card>
  );
}
