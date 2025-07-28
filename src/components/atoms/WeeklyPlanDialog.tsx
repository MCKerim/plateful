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
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [currentWeek, setCurrentWeek] = useState(new Date());

  function goToPreviousWeek() {
    setCurrentWeek((prevWeek) => subWeeks(prevWeek, 1));
  }

  function goToNextWeek() {
    setCurrentWeek((prevWeek) => addWeeks(prevWeek, 1));
  }

  function goToCurrentWeek() {
    setCurrentWeek(new Date());
  }

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
          {/* Week Navigation */}
          <div className="sticky flex items-center justify-between px-2 pb-2 bg-background">
            <Button variant="ghost" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft size={20} />
            </Button>

            <div className="flex flex-col items-center">
              <h2 className="text-lg font-semibold">
                {isSameWeek(currentWeek, new Date())
                  ? "Diese Woche"
                  : isSameWeek(currentWeek, addWeeks(new Date(), 1))
                  ? "Nächste Woche"
                  : isSameWeek(currentWeek, subWeeks(new Date(), 1))
                  ? "Letzte Woche"
                  : `${format(getWeekdays(currentWeek)[0], "dd.MM")} - ${format(
                      getWeekdays(currentWeek)[6],
                      "dd.MM"
                    )}`}
              </h2>

              {!isSameWeek(currentWeek, new Date()) && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={goToCurrentWeek}
                  className="h-auto p-0 text-xs text-muted-foreground"
                >
                  Zur aktuellen Woche
                </Button>
              )}

              {isSameWeek(currentWeek, new Date()) && (
                <div className="h-[16px]"></div>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={goToNextWeek}>
              <ChevronRight size={20} />
            </Button>
          </div>

          {getWeekdays(currentWeek).map((day) => (
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
