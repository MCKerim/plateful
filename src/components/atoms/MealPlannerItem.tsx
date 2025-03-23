import { NavLink } from "react-router";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import PlanDialog from "./PlanDialog";

type Props = {
  id: number;
  recipeId: number;
  recipeName: string;
  date: Date | null;
  days: number;
  onDelete: (id: number) => void;
  onUpdateDate: (id: number, newDate: Date | null, newDays: number) => void;
};

export default function MealPlannerItem({
  id,
  recipeId,
  recipeName,
  days,
  onDelete,
  onUpdateDate,
}: Readonly<Props>) {
  return (
    <Card className={"w-full"}>
      <CardHeader className="px-4 py-2">
        <div className="flex">
          <NavLink className="flex-1" to={`/recipe/${recipeId}`}>
            <CardTitle className="text-lg">{recipeName}</CardTitle>

            <CardDescription style={{ margin: "0px" }}>
              {days} {days > 1 ? "days" : "day"}
            </CardDescription>
          </NavLink>

          <div className="flex gap-2 items-center">
            <PlanDialog id={id} days={days} onUpdateDate={onUpdateDate} />

            <Button variant="destructive" onClick={() => onDelete(id)}>
              D
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
