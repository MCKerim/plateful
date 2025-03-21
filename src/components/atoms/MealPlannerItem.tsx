import { NavLink } from "react-router";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { toWeekday } from "@/lib/dateHelper";
import { Button } from "../ui/button";

type Props = {
  id: number;
  recipeId: number;
  recipeName: string;
  date: Date;
  onDelete: (id: number) => void;
};

export default function MealPlannerItem({
  id,
  recipeId,
  recipeName,
  date,
  onDelete,
}: Readonly<Props>) {
  return (
    <Card className={"w-full"}>
      <CardHeader className="px-4 py-2">
        <div className="flex">
          <NavLink className="flex-1" to={`/recipe/${recipeId}`}>
            <CardTitle className="text-lg">{recipeName}</CardTitle>

            <CardDescription style={{ margin: "0px" }}>
              {toWeekday(date)}
            </CardDescription>
          </NavLink>

          <div className="flex gap-2">
            <Button variant="secondary">E</Button>

            <Button variant="destructive" onClick={() => onDelete(id)}>
              D
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
