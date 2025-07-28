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
import { useTranslation } from "react-i18next";
import { CalendarDays } from "lucide-react";
import { getWeekdays } from "@/lib/dateHelper";
import {
  format,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
  isSameWeek,
} from "date-fns";

export default function WeeklyPlanDialog() {
  const { t } = useTranslation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  function handleDialogOpenChange(isOpen: boolean) {
    setIsDialogOpen(isOpen);
  }

  function toggleWeekDate(date: Date) {
    setSelectedDates((prev) => {
      if (prev.some((d) => isSameDay(d, date))) {
        return prev.filter((d) => !isSameDay(d, date));
      } else {
        return [...prev, date];
      }
    });
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger>
        <Button className="w-full">
          <CalendarDays />

          {t("recipe.planRecipe")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Wähle Wochentage</DialogTitle>
        </DialogHeader>

        <DialogDescription className="flex flex-col gap-2">
          {getWeekdays(new Date()).map((day) => (
            <Button
              key={format(day, "EEE - dd.MM")}
              variant="outline"
              onClick={() => toggleWeekDate(day)}
              className={
                selectedDates.some((d) => isSameDay(d, day))
                  ? "bg-accent text-accent-foreground"
                  : ""
              }
            >
              {format(day, "EEE - dd.MM")}
            </Button>
          ))}

          <Button variant="secondary">Ohne Datum</Button>

          <Button className="mt-4">Fertig</Button>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
