import { NavLink } from "react-router";
import { Card } from "../ui/card";
import { motion } from "motion/react";
import { useRecipeFirstImage } from "@/hooks/recipe/useRecipeFirstImage";

type Props = {
  recipeId: string;
  recipeName: string;
};

export default function PlannedMealCard({
  recipeId,
  recipeName,
}: Readonly<Props>) {
  const { data: imageUrl } = useRecipeFirstImage(recipeId);

  return (
    <NavLink to={`/recipe/${recipeId}`}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Card className="h-[60px] flex items-center">
          <img
            src={imageUrl || "/no-img.jpg"}
            alt="Recipe"
            className="h-full w-[62px] object-cover border-r-4 border-background dark:brightness-75 rounded-l-xl"
          />

          <div className="flex-1 px-3 min-w-0">
            <p className="second-font text-sm font-semibold break-words leading-tight line-clamp-2">
              {recipeName}
            </p>
          </div>
        </Card>
      </motion.div>
    </NavLink>
  );
}
