import { NavLink } from "react-router";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { toWeekday } from "@/lib/dateHelper";

type Props = {
  id: number;
  recipeName: string;
  date: Date;
};

export default function MealPlannerItem({
  id,
  recipeName,
  date,
}: Readonly<Props>) {
  return (
    <NavLink to={`/recipe/${id}`}>
      <Card
      className={"w-full"}
    >
      <CardHeader className="px-4 py-2">
        <div className="flex">
          <div className="flex-1">
            <CardTitle className="text-lg">{recipeName}</CardTitle>
            <CardDescription style={{ margin: "0px" }}>
              {toWeekday(date)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
    </NavLink>
    
  );
}
