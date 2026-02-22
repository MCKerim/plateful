import { NavLink } from "react-router";
import { Card } from "../ui/card";
import StarIcon from "@mui/icons-material/Star";
import TagPill from "./TagPill";
import { CalendarDays } from "lucide-react";
import { getMealPlanStatus } from "@/lib/mealPlanHelper/mealPlanHelper";
import { useTranslation } from "react-i18next";
import { formatRating } from "@/lib/formateRatingHelper/formatRatingHelper";
import { useRecipeFirstImage } from "@/hooks/recipe/useRecipeFirstImage";
import { useRecipeMealPlanInfo } from "@/hooks/meal-planning/useRecipeMealPlanInfo";
import { RecipeStatus } from "@/types/cookbook.types";
import ImportingRecipeCard from "./ImportingRecipeCard";
import { motion } from "motion/react";

type Props = {
  id: string;
  name: string;
  averageRating: number | null;
  status?: RecipeStatus;
  showRating?: boolean;
  showMealPlanStatus?: boolean;
};

export default function RecipeCard({
  id,
  name,
  averageRating,
  status = "ready",
  showRating = true,
  showMealPlanStatus = true,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const { data: imageUrl } = useRecipeFirstImage(id);
  const { data: lastMealPlan } = useRecipeMealPlanInfo(id);

  if (status === "importing") {
    return <ImportingRecipeCard />;
  }

  const TAGS: string[] = [];

  function renderTagPills() {
    return TAGS.map((tag, index) => <TagPill key={index} name={tag} color="green" />);
  }

  return (
    <NavLink to={`/recipe/${id}`} className="w-full">
      <motion.div
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Card className="relative bg-transparent">
          <img
            src={imageUrl || "/no-img.jpg"}
            alt="Recipe"
            className="object-cover w-full h-32 border-background dark:brightness-75"
          />

          <div className="flex flex-col justify-between gap-2 p-2 border-b-2 border-l-2 border-r-2 rounded-b-lg">
            <div className="flex justify-between">
              <h1 className="second-font font-bold leading-tight text-md line-clamp-2 break-words">
                {name}
              </h1>
            </div>

            {TAGS.length > 0 && <div className="flex gap-1">{renderTagPills()}</div>}

            <div className="flex justify-between">
              {showMealPlanStatus && (
                <div className="flex items-center gap-1">
                  <CalendarDays size={16} />

                  <p className="text-xs">{getMealPlanStatus(lastMealPlan ?? null, t)}</p>
                </div>
              )}

              {showRating && (
                <div className="flex items-center">
                  <p className="text-xs">{formatRating(averageRating)}</p>

                  <StarIcon style={{ fontSize: "16px" }} />
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </NavLink>
  );
}
