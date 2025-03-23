import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { DialogDescription } from "@radix-ui/react-dialog";

type Props = {
  isEdit?: boolean;
  id: number;
  initialDays?: number;
  onUpdateDate: (id: number, newDate: Date | null, newDays: number) => void;
};

export default function PlanDialog({
  isEdit = false,
  id,
  initialDays = 0,
  onUpdateDate,
}: Readonly<Props>) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [daysToPlan, setDaysToPlan] = useState<number>(initialDays);

  function saveDate(days: number) {
    onUpdateDate(id, null, days);
    setIsDialogOpen(false);
  }

  function handleDialogOpenChange(isOpen: boolean) {
    setIsDialogOpen(isOpen);
    if (isOpen) {
      setDaysToPlan(initialDays);
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger>
        <Button variant="outline" className="w-full">
          {isEdit ? "Edit" : "Plan recipe"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select number of days</DialogTitle>
        </DialogHeader>

        <DialogDescription className="flex flex-col py-4 gap-4">
          <div className="flex gap-2">
            <Button
              className="w-full"
              variant={daysToPlan === 1 ? "secondary" : "outline"}
              onClick={() => saveDate(1)}
            >
              1 Day
            </Button>

            <Button
              className="w-full"
              variant={daysToPlan === 2 ? "secondary" : "outline"}
              onClick={() => saveDate(2)}
            >
              2 Days
            </Button>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
