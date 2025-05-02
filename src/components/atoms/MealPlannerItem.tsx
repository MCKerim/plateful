import { NavLink } from "react-router";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import NoMealsIcon from "@mui/icons-material/NoMeals";
import RestaurantIcon from "@mui/icons-material/Restaurant";

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
};

export default function MealPlannerItem({
  recipeId,
  recipeName,
  days,
  daysEaten,
  setDaysEaten,
}: Readonly<Props>) {
  function eat() {
    if (daysEaten + 1 > days) {
      setDaysEaten(0);
    } else {
      setDaysEaten(daysEaten + 1);
    }
  }

  return (
    <Card className="h-[90px] flex items-center">
      <img
        src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
        alt="Spaghetti"
        className="h-full w-[74px] object-cover border-r-4 border-background"
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
