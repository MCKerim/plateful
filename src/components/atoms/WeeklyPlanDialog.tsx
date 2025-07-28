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

type Props = {
  onFinish: (selectedDates: Date[]) => void;
};

export default function WeeklyPlanDialog({ onFinish }: Readonly<Props>) {
  const { t } = useTranslation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [withoutDate, setWithoutDate] = useState(false);

  function handleDialogOpenChange(isOpen: boolean) {
    setIsDialogOpen(isOpen);
  }

  function toggleWeekDate(date: Date) {
    const updatedDates = selectedDates.some((d) => isSameDay(d, date))
      ? selectedDates.filter((d) => !isSameDay(d, date))
      : [...selectedDates, date];

    if (updatedDates.length > 0) {
      setWithoutDate(false);
    }

    setSelectedDates(updatedDates);
  }

  function toggleWithoutDate() {
    const updatedWithoutDate = !withoutDate;
    if (updatedWithoutDate) {
      setSelectedDates([]);
    }

    setWithoutDate(updatedWithoutDate);
  }

  function handleFinish() {
    if (selectedDates.length === 0 && !withoutDate) {
      alert("Bitte wähle einen Tag aus oder wähle 'Ohne Datum'");
      return;
    }

    onFinish(selectedDates);
    setIsDialogOpen(false);
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
          <DialogTitle>Für wann möchtest du das Rezept planen?</DialogTitle>
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

          <Button
            variant="secondary"
            className={withoutDate ? "bg-accent text-accent-foreground" : ""}
            onClick={toggleWithoutDate}
          >
            Ohne Datum
          </Button>

          <Button className="mt-4" onClick={handleFinish}>
            Fertig
          </Button>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
