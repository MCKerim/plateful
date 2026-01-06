import { NavLink } from "react-router";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import NoMealsIcon from "@mui/icons-material/NoMeals";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import { useEffect, useState } from "react";
import { useSupabase } from "@/utils/supabase";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger,
} from "../ui/drawer";
import { MoreVertical, Trash2 } from "lucide-react";
import DeleteDialog from "./DeleteDialog";
import { useTranslation } from "react-i18next";

type Props = {
  id: number;
  recipeId: number;
  recipeName: string;
  date: Date | null;
  days: number;
  daysEaten: number;
  setDaysEaten: (days: number) => void;
  onUpdateDate: (id: number, newDate: Date | null, newDays: number) => void;
  onRecipeEaten: (id: number) => void;
  onRecipeDelete: (id: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

export default function MealPlannerItem({
  id,
  recipeId,
  recipeName,
  days,
  daysEaten,
  setDaysEaten,
  onRecipeEaten,
  onRecipeDelete,
  onDragStart,
  onDragEnd,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  function handleDragStart(e: React.DragEvent) {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";

    onDragStart?.();
  }

  function handleDragEnd(e: React.DragEvent) {
    setIsDragging(false);
    onDragEnd?.();
  }

  return (
    <Card
      className={`h-[90px] flex items-center cursor-move transition-opacity ${
        isDragging ? "opacity-50" : ""
      }`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <img
        src={imageUrl || "/no-img.jpg"}
        alt="Spaghetti"
        className="h-full w-[74px] object-cover border-r-4 border-background dark:brightness-75"
        draggable={false}
      />

      <NavLink
        className="second-font flex-1 text-md font-semibold px-2.5 break-words leading-tight line-clamp-3"
        to={`/recipe/${recipeId}`}
        draggable={false}
      >
        {recipeName}
      </NavLink>

      <Button
        className="flex gap-2 items-center me-1"
        variant="outline"
        onClick={eat}
      >
        {Array.from({ length: 1 }, (_, index) => (
          <>
            {index < daysEaten ? (
              <NoMealsIcon style={{ fontSize: 24 }} />
            ) : (
              <RestaurantIcon style={{ fontSize: 24 }} />
            )}
          </>
        ))}
      </Button>

      <Drawer>
        <DrawerTrigger asChild>
          <Button className="me-2.5" variant="outline">
            <MoreVertical size={16} />
          </Button>
        </DrawerTrigger>

        <DrawerContent>
          <DrawerFooter className="gap-2 mb-8 mt-4">
            <DeleteDialog
              onDelete={() => onRecipeDelete(id)}
              customTrigger={
                <Button className="w-full" variant="destructive">
                  <Trash2 size={16} />

                  {t("common.delete")}
                </Button>
              }
            />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Card>
  );
}
