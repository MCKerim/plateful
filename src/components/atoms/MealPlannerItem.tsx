import { NavLink } from "react-router";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { toWeekday } from "@/lib/dateHelper";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import DayPicker from "@/components/atoms/DayPicker";
import { useState } from "react";
import { DialogDescription } from "@radix-ui/react-dialog";

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
  const [dateToPlan, setDateToPlan] = useState<Date | undefined>();

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

          <div className="flex gap-2 items-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Edit</Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit date</DialogTitle>
                </DialogHeader>

                <DialogDescription>
                  <div className="flex gap-2 w-full py-4">
                    <DayPicker date={dateToPlan} setDate={setDateToPlan} />
                  </div>
                </DialogDescription>

                <DialogFooter>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="destructive" onClick={() => onDelete(id)}>
              D
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
