import { NavLink } from "react-router";
import { Card } from "../ui/card";
import StarIcon from "@mui/icons-material/Star";
import TagPill from "./TagPill";
import { CalendarDays } from "lucide-react";
import { getMealPlanStatus } from "@/lib/mealPlanHelper";
import { useTranslation } from "react-i18next";
import { formatRating } from "@/lib/formatRatingHelper";
import { useRecipeFirstImage } from "@/hooks/recipe";
import { useRecipeMealPlanInfo } from "@/hooks/meal-planning";

type Props = {
  id: number;
  name: string;
  averageRating: number | null;
};

export default function RecipeCard({
  id,
  name,
  averageRating,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const { data: imageUrl } = useRecipeFirstImage(id);
  const { data: lastMealPlan } = useRecipeMealPlanInfo(id);

  const TAGS: string[] = [];

  function renderTagPills() {
    return TAGS.map((tag, index) => (
      <TagPill key={index} name={tag} color="green" />
    ));
  }

  return (
    <NavLink to={`/recipe/${id}`} className="w-full">
      <Card className="relative bg-transparent border-2">
        <img
          src={imageUrl || "/no-img.jpg"}
          alt="Recipe"
          className="object-cover w-full h-32 border-b-4 border-background dark:brightness-75"
        />

        <div className="flex flex-col justify-between gap-2 p-2">
          <div className="flex justify-between">
            <h1 className="second-font font-bold leading-tight text-md line-clamp-2 break-words">
              {name}
            </h1>
          </div>

          {TAGS.length > 0 && (
            <div className="flex gap-1">{renderTagPills()}</div>
          )}

          <div className="flex justify-between">
            <div className="flex items-center gap-1">
              <CalendarDays size={16} />

              <p className="text-xs">{getMealPlanStatus(lastMealPlan ?? null, t)}</p>
            </div>

            <div className="flex items-center">
              <p className="text-xs">{formatRating(averageRating)}</p>

              <StarIcon style={{ fontSize: "16px" }} />
            </div>
          </div>
        </div>
      </Card>
    </NavLink>
  );
}
