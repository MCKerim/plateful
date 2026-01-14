import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { DialogDescription } from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { getWeekdays } from "@/lib/dateHelper";
import { format, isSameDay, addWeeks, subWeeks, isSameWeek } from "date-fns";
import { enUS, es, fr, de } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";

type Props = {
  onFinish: (selectedDates: Date[]) => void;
};

type PlannedItemSummary = {
  planned_date: string;
  recipe_name: string;
};

const locales = {
  en: enUS,
  es: es,
  fr: fr,
  de: de,
};

function usePlannedItemsForWeek(currentWeek: Date, enabled: boolean) {
  const { supabase } = useSupabase();
  const weekDays = getWeekdays(currentWeek);
  const weekStart = new Date(weekDays[0]);
  const weekEnd = new Date(weekDays[6]);

  weekStart.setHours(0, 0, 0, 0);
  weekEnd.setHours(23, 59, 59, 999);

  return useQuery({
    // UNIFIED QUERY KEY: Start with 'meal-planning'
    queryKey: ["meal-planning", "summary", weekStart.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_planning")
        .select(
          `
          planned_date,
          recipes (name)
        `
        )
        .gte("planned_date", weekStart.toISOString())
        .lte("planned_date", weekEnd.toISOString())
        .order("planned_date", { ascending: true });

      if (error) throw error;

      return (data || []).map((item) => ({
        planned_date: item.planned_date,
        recipe_name: item.recipes?.name ?? "Unknown",
      })) as PlannedItemSummary[];
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

function getPlannedItemsForDate(
  plannedItems: PlannedItemSummary[],
  date: Date
): PlannedItemSummary[] {
  return plannedItems.filter(
    (item) => item.planned_date && isSameDay(new Date(item.planned_date), date)
  );
}

export default function WeeklyPlanDialog({ onFinish }: Readonly<Props>) {
  const { t, i18n } = useTranslation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [withoutDate, setWithoutDate] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const { data: plannedItems = [] } = usePlannedItemsForWeek(
    currentWeek,
    isDialogOpen
  );

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

    if (!isOpen) {
      setSelectedDates([]);
      setWithoutDate(false);
      setCurrentWeek(new Date());
    }
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
      alert(t("mealPlanner.selectDayOrWithoutDate"));
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
                  ? t("mealPlanner.thisWeek")
                  : isSameWeek(currentWeek, addWeeks(new Date(), 1))
                  ? t("mealPlanner.nextWeek")
                  : isSameWeek(currentWeek, subWeeks(new Date(), 1))
                  ? t("mealPlanner.lastWeek")
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
                  {t("mealPlanner.goToCurrentWeek")}
                </Button>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={goToNextWeek}>
              <ChevronRight size={20} />
            </Button>
          </div>

          {/* Day Buttons */}
          {getWeekdays(currentWeek).map((day) => {
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDates.some((d) => isSameDay(d, day));
            const plannedForDay = getPlannedItemsForDate(plannedItems, day);
            const hasPlannedItems = plannedForDay.length > 0;

            return (
              <Button
                key={day.toISOString()}
                variant="outline"
                onClick={() => toggleWeekDate(day)}
                className={`h-auto min-h-10 py-2 flex flex-col items-start gap-1 ${
                  isSelected
                    ? "bg-accent text-accent-foreground ring-2 ring-primary"
                    : ""
                }`}
              >
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isToday && (
                      <span className="rounded-full px-2 py-0.5 text-xs bg-primary text-primary-foreground">
                        {t("common.today")}
                      </span>
                    )}
                    <span>
                      {format(day, "EEE - dd.MM", {
                        locale:
                          locales[i18n.language as keyof typeof locales] ||
                          enUS,
                      })}
                    </span>
                  </div>

                  {hasPlannedItems && (
                    <span className="text-xs text-muted-foreground">
                      {plannedForDay.length} {t("mealPlanner.planned")}
                    </span>
                  )}
                </div>

                {/* Show planned items */}
                {hasPlannedItems && (
                  <div className="w-full flex flex-wrap gap-1">
                    {plannedForDay.map((item, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground truncate max-w-[150px]"
                      >
                        {item.recipe_name}
                      </span>
                    ))}
                  </div>
                )}
              </Button>
            );
          })}

          {/* Without Date Button */}
          <Button
            variant="secondary"
            className={
              withoutDate
                ? "bg-accent text-accent-foreground ring-2 ring-primary"
                : ""
            }
            onClick={toggleWithoutDate}
          >
            {t("mealPlanner.noDate")}
          </Button>

          {/* Save Button */}
          <Button className="mt-4" onClick={handleFinish}>
            {t("common.save")}
          </Button>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
