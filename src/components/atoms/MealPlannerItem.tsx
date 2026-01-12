import { useNavigate } from "react-router";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import NoMealsIcon from "@mui/icons-material/NoMeals";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import { useEffect, useState } from "react";
import { useSupabase } from "@/utils/supabase";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger,
} from "../ui/drawer";
import { CalendarOff, MoreVertical, Trash2 } from "lucide-react";
import DeleteDialog from "./DeleteDialog";
import { useTranslation } from "react-i18next";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

type Props = {
  id: number;
  recipeId: number;
  recipeName: string;
  date: Date | null;
  days: number;
  daysEaten: number;
  setDaysEaten: (days: number) => void;
  onRecipeEaten: (id: number) => void;
  onRecipeDelete: (id: number) => void;
  onUpdateToNoDate: (id: number) => void;
  isDragging?: boolean;
};

export default function MealPlannerItem({
  id,
  recipeId,
  recipeName,
  date,
  days,
  daysEaten,
  setDaysEaten,
  onRecipeEaten,
  onRecipeDelete,
  onUpdateToNoDate,
  isDragging = false,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
    data: {
      type: "meal-planner-item",
    },
  });

  const style = {
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
  };

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
    <Card
      ref={setNodeRef}
      style={style}
      className={`h-[90px] flex items-center ${isDragging ? "invisible" : ""}`}
    >
      <div
        className="flex h-full flex-1 items-center min-w-0 cursor-grab active:cursor-grabbing touch-none"
        {...listeners}
        {...attributes}
      >
        <img
          src={imageUrl || "/no-img.jpg"}
          alt="Recipe"
          className="h-full w-[74px] object-cover border-r-4 border-background dark:brightness-75 pointer-events-none"
        />

        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/recipe/${recipeId}`);
          }}
          className="text-left flex-1 px-2.5 min-w-0 h-full flex items-center"
        >
          <p className="second-font text-md font-semibold break-words leading-tight line-clamp-3 w-full">
            {recipeName}
          </p>
        </button>
      </div>

      <Button
        className="flex gap-2 items-center me-1"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          eat();
        }}
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
            <DrawerClose asChild>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => onUpdateToNoDate(id)}
                disabled={date === null}
              >
                <CalendarOff size={20} />
                {t("mealPlannerItem.removeDate")}
              </Button>
            </DrawerClose>

            <DeleteDialog
              onDelete={() => onRecipeDelete(id)}
              customTrigger={
                <Button className="w-full" variant="destructive">
                  <Trash2 size={16} />
                  {t("mealPlannerItem.remove")}
                </Button>
              }
            />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Card>
  );
}
