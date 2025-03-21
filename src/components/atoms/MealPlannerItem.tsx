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
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type Props = {
  id: number;
  recipeId: number;
  recipeName: string;
  date: Date;
  days: number;
  onDelete: (id: number) => void;
  onUpdateDate: (id: number, newDate: Date, newDays: number) => void;
};

export default function MealPlannerItem({
  id,
  recipeId,
  recipeName,
  date,
  days,
  onDelete,
  onUpdateDate,
}: Readonly<Props>) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dateToPlan, setDateToPlan] = useState<Date | undefined>(date);
  const [daysToPlan, setDaysToPlan] = useState<number>(days);

  const saveDate = () => {
    if (dateToPlan) {
      onUpdateDate(id, dateToPlan, daysToPlan);
      setIsDialogOpen(false);
    }
  };

  const handleDialogOpenChange = (isOpen: boolean) => {
    setIsDialogOpen(isOpen);
    if (isOpen) {
      setDateToPlan(date);
      setDaysToPlan(days);
    }
  };

  return (
    <Card className={"w-full"}>
      <CardHeader className="px-4 py-2">
        <div className="flex">
          <NavLink className="flex-1" to={`/recipe/${recipeId}`}>
            <CardTitle className="text-lg">{recipeName}</CardTitle>

            <CardDescription style={{ margin: "0px" }}>
              {toWeekday(date)} • {days} {days > 1 ? "days" : "day"}
            </CardDescription>
          </NavLink>

          <div className="flex gap-2 items-center">
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger>
                <Button variant="outline">Edit</Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit date</DialogTitle>
                </DialogHeader>

                <DialogDescription className="flex flex-col py-4 gap-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="days">Date</Label>
                    <DayPicker date={dateToPlan} setDate={setDateToPlan} />
                  </div>
                  

                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="days">Number of days</Label>
                    <Input type="number" id="days" placeholder="Days" value={daysToPlan} onChange={(e) => setDaysToPlan(Number(e.target.value))} />
                  </div>
                </DialogDescription>

                <DialogFooter>
                  <Button className="w-full" onClick={saveDate}>Save</Button>
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
