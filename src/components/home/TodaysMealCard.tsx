import { useNavigate } from "react-router";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Check } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSetEaten } from "@/hooks/meal-planning/useSetDaysEaten";
import { useRecipeFirstImage } from "@/hooks/recipe/useRecipeFirstImage";
import { getTranslatedCategory } from "@/lib/recipeCategoryHelper/recipeCategoryHelper";
import RatingModal, { RatingModalRef } from "@/components/general/RatingModal";

type Props = {
  id: string;
  recipeId: string;
  recipeName: string;
  recipeCategory: number | null;
  eaten: boolean;
};

export default function TodaysMealCard({
  id,
  recipeId,
  recipeName,
  recipeCategory,
  eaten,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: imageUrl } = useRecipeFirstImage(recipeId);
  const setEaten = useSetEaten();
  const ratingModalRef = useRef<RatingModalRef>(null);

  return (
    <>
      <Card className={`relative bg-transparent ${eaten ? "opacity-60" : ""}`}>
        <button onClick={() => navigate(`/recipe/${recipeId}`)} className="block w-full text-left">
          <img
            src={imageUrl || "/no-img.jpg"}
            alt="Recipe"
            className="object-cover w-full h-32 border-background dark:brightness-75"
          />
        </button>

        <div className="flex flex-col gap-2 p-2 border-b-2 border-l-2 border-r-2 rounded-b-lg">
          <button onClick={() => navigate(`/recipe/${recipeId}`)} className="text-left">
            <h3 className="second-font font-bold leading-tight text-md line-clamp-2 break-words">
              {recipeName}
            </h3>

            {recipeCategory !== null && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {getTranslatedCategory(t, recipeCategory)}
              </p>
            )}
          </button>

          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              className={`flex-1 ${eaten ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
              onClick={() => {
                setEaten.mutate({ id, eaten: !eaten });
                if (!eaten) ratingModalRef.current?.open();
              }}
            >
              <Check className="!size-4" />
              {t("home.markComplete")}
            </Button>
          </div>
        </div>
      </Card>

      <RatingModal ref={ratingModalRef} recipeId={recipeId} showTriggerButton={false} />
    </>
  );
}
