import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { DialogDescription } from "@radix-ui/react-dialog";

type Props = {
  id: number;
  days: number;
  onUpdateDate: (id: number, newDate: Date | null, newDays: number) => void;
};

export default function PlanDialog({
  id,
  days,
  onUpdateDate,
}: Readonly<Props>) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // const [dateToPlan, setDateToPlan] = useState<Date | null>(date);
  const [daysToPlan, setDaysToPlan] = useState<number>(days);

  const saveDate = () => {
    onUpdateDate(id, null, daysToPlan);
    setIsDialogOpen(false);
  };

  const handleDialogOpenChange = (isOpen: boolean) => {
    setIsDialogOpen(isOpen);
    if (isOpen) {
      // setDateToPlan(date);
      setDaysToPlan(days);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger>
        <Button variant="outline">Edit</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Plan your meal</DialogTitle>
        </DialogHeader>

        <DialogDescription className="flex flex-col py-4 gap-4">
          {/*<div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="days">Date</Label>

                    <DayPicker date={dateToPlan} setDate={setDateToPlan} />
                  </div>*/}

          <div className="flex gap-2">
            <Button className="w-full" variant={daysToPlan === 1 ? "secondary" : "outline"} onClick={() => setDaysToPlan(1)}>
              1 Day
            </Button>

            <Button className="w-full" variant={daysToPlan === 2 ? "secondary" : "outline"} onClick={() => setDaysToPlan(2)}>
              2 Days
            </Button>
          </div>
        </DialogDescription>

        <DialogFooter>
          <Button className="w-full" onClick={saveDate}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
