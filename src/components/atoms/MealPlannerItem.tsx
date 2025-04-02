import { NavLink } from "react-router";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import PlanDialog from "./PlanDialog";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Button } from "../ui/button";
import { Wheat, WheatOff } from "lucide-react";

type Props = {
  id: number;
  recipeId: number;
  recipeName: string;
  date: Date | null;
  days: number;
  onDeleteDate: (id: number) => void;
  onUpdateDate: (id: number, newDate: Date | null, newDays: number) => void;
};

export default function MealPlannerItem({
  id,
  recipeId,
  recipeName,
  days,
  onDeleteDate,
  onUpdateDate,
}: Readonly<Props>) {
  const { t } = useTranslation();

  const [daysEaten, setDaysEaten] = useState(0);

  function eat() {
    setDaysEaten((prevDaysEaten) => (prevDaysEaten + 1 > days ? 0 : prevDaysEaten + 1));
  }

  return (
    <Card className="w-full">
      <CardHeader className="px-4 py-2">
        <div className="flex">
          <NavLink className="flex-1" to={`/recipe/${recipeId}`}>
            <CardTitle className="text-lg">{recipeName}</CardTitle>

            <CardDescription style={{ margin: "0px" }}>
              {t("dayWithCount", { count: days })}
            </CardDescription>
          </NavLink>

          <div className="flex gap-2 items-center">
          {Array.from({ length: days }, (_, index) =>
            index < daysEaten ? <WheatOff key={index} /> : <Wheat key={index} />
          )}

            <Button onClick={eat}>+</Button>

            <PlanDialog isEdit id={id} initialDays={days} onUpdateDate={onUpdateDate} onDeleteDate={onDeleteDate} />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
