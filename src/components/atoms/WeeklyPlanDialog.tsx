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
import { format, isSameDay, addWeeks, subWeeks, isSameWeek } from "date-fns";
import { enUS, es, fr, de } from "date-fns/locale";

type Props = {
  onFinish: (selectedDates: Date[]) => void;
};

const locales = {
  en: enUS,
  es: es,
  fr: fr,
  de: de,
};

export default function WeeklyPlanDialog({ onFinish }: Readonly<Props>) {
  const { t, i18n } = useTranslation();

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
      <DialogTrigger asChild>
        <Button className="w-full" variant="accent">
          <CalendarDays />

          {t("recipe.planRecipe")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogDescription className="flex flex-col gap-2">
          {/* Week Navigation */}
          <div className="sticky flex items-center justify-between px-2 pb-2 h-[68px] pt-4 bg-background">
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
            </div>

            <Button variant="ghost" size="sm" onClick={goToNextWeek}>
              <ChevronRight size={20} />
            </Button>
          </div>

          {getWeekdays(currentWeek).map((day) => (
            <Button
              key={format(day, "EEE - dd.MM", {
                locale: locales[i18n.language as keyof typeof locales] || enUS,
              })}
              variant="outline"
              onClick={() => toggleWeekDate(day)}
              className={
                selectedDates.some((d) => isSameDay(d, day))
                  ? "bg-accent text-accent-foreground"
                  : ""
              }
            >
              {format(day, "EEE - dd.MM", {
                locale: locales[i18n.language as keyof typeof locales] || enUS,
              })}
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
            {t("common.save")}
          </Button>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
