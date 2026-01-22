import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { getWeekdays } from "@/lib/dateHelper/dateHelper";
import { format, isSameDay, addWeeks, subWeeks, isSameWeek } from "date-fns";
import { enUS, es, fr, de } from "date-fns/locale";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import {
  usePlannedItemsSummary,
  useRecipePlansForWeek,
  useSaveRecipePlans,
} from "@/hooks/meal-planning";

type Props = {
  recipeId: number;
  recipeName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode | null;
  onSaveComplete?: (result: {
    success: boolean;
    added: number;
    removed: number;
  }) => void;
  navigateOnSuccess?: boolean;
};

const locales = {
  en: enUS,
  es: es,
  fr: fr,
  de: de,
};

function getPlannedItemsForDate(
  plannedItems: { planned_date: string; recipe_name: string }[],
  date: Date
) {
  return plannedItems.filter(
    (item) =>
      item.planned_date && isSameDay(new Date(item.planned_date), date)
  );
}

export default function WeeklyPlanDialog({
  recipeId,
  recipeName,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  onSaveComplete,
  navigateOnSuccess = false,
}: Readonly<Props>) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const householdId = useAppSelector(selectHouseholdId);

  // Support both controlled and uncontrolled modes
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isDialogOpen = isControlled ? controlledOpen : internalOpen;

  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [withoutDate, setWithoutDate] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  // Track which weeks have been initialized (by week start date ISO string)
  const [initializedWeeks, setInitializedWeeks] = useState<Set<string>>(
    new Set()
  );

  // Fetch all planned items summary (for showing recipes on each day - includes recipe names)
  const { data: plannedItems = [], isFetching: isFetchingPlannedItems } =
    usePlannedItemsSummary(currentWeek, isDialogOpen);

  // Fetch existing plans for THIS recipe in the current week (needed for IDs to delete)
  const { data: recipePlans = [] } = useRecipePlansForWeek(
    recipeId,
    currentWeek,
    isDialogOpen
  );

  // Mutation for saving
  const saveMutation = useSaveRecipePlans();

  // Check if a date has THIS recipe planned (using the always-fresh plannedItems data)
  function isDatePlannedForThisRecipe(date: Date): boolean {
    const itemsForDay = getPlannedItemsForDate(plannedItems, date);
    return itemsForDay.some((item) => item.recipe_name === recipeName);
  }

  // Get the plan ID for a specific date (from recipePlans which has IDs)
  function getPlanIdForDate(date: Date): number | null {
    const plan = recipePlans.find(
      (p) => p.planned_date && isSameDay(p.planned_date, date)
    );
    return plan?.id ?? null;
  }

  // Reset state when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setSelectedDates([]);
      setWithoutDate(false);
      setCurrentWeek(new Date());
      setInitializedWeeks(new Set());
    }
  }, [isDialogOpen]);

  // Reset when recipe changes
  useEffect(() => {
    setSelectedDates([]);
    setWithoutDate(false);
    setCurrentWeek(new Date());
    setInitializedWeeks(new Set());
  }, [recipeId]);

  // Initialize/update selected dates when week changes or data loads
  // This adds already-planned dates for weeks that haven't been initialized yet
  useEffect(() => {
    // Don't initialize while data is still being fetched for this week
    if (!isDialogOpen || isFetchingPlannedItems) return;

    const weekKey = getWeekdays(currentWeek)[0].toISOString();

    // Skip if this week has already been initialized
    if (initializedWeeks.has(weekKey)) return;

    // Find all days in current week that have this recipe planned
    const weekDays = getWeekdays(currentWeek);
    const alreadyPlannedDates = weekDays.filter((day) =>
      isDatePlannedForThisRecipe(day)
    );

    // Add the already-planned dates to selectedDates (without duplicates)
    if (alreadyPlannedDates.length > 0) {
      setSelectedDates((prev) => {
        const newDates = [...prev];
        for (const date of alreadyPlannedDates) {
          if (!newDates.some((d) => isSameDay(d, date))) {
            newDates.push(date);
          }
        }
        return newDates;
      });
    }

    // Mark this week as initialized
    setInitializedWeeks((prev) => new Set(prev).add(weekKey));
  }, [
    isDialogOpen,
    plannedItems,
    currentWeek,
    initializedWeeks,
    recipeName,
    isFetchingPlannedItems,
  ]);

  function handleOpenChange(open: boolean) {
    if (isControlled) {
      controlledOnOpenChange?.(open);
    } else {
      setInternalOpen(open);
    }
  }

  function goToPreviousWeek() {
    setCurrentWeek((prevWeek) => subWeeks(prevWeek, 1));
  }

  function goToNextWeek() {
    setCurrentWeek((prevWeek) => addWeeks(prevWeek, 1));
  }

  function goToCurrentWeek() {
    setCurrentWeek(new Date());
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

  async function handleSave() {
    if (!householdId) {
      toast.error(t("common.error"));
      return;
    }

    // Get all days in current week that have this recipe planned
    const weekDays = getWeekdays(currentWeek);
    const currentlyPlannedDates = weekDays.filter((day) =>
      isDatePlannedForThisRecipe(day)
    );

    // Determine what to add and remove
    const planIdsToRemove: number[] = [];
    for (const plannedDate of currentlyPlannedDates) {
      const isStillSelected = selectedDates.some((d) =>
        isSameDay(d, plannedDate)
      );
      if (!isStillSelected) {
        const planId = getPlanIdForDate(plannedDate);
        if (planId) {
          planIdsToRemove.push(planId);
        }
      }
    }

    const datesToAdd = selectedDates.filter(
      (date) => !currentlyPlannedDates.some((pd) => isSameDay(pd, date))
    );

    // Only show error if nothing is selected AND there's nothing to remove (i.e., no changes)
    if (selectedDates.length === 0 && !withoutDate && planIdsToRemove.length === 0) {
      toast.error(t("mealPlanner.selectDayOrWithoutDate"));
      return;
    }

    // Check if there are actual changes
    const hasChanges =
      planIdsToRemove.length > 0 || datesToAdd.length > 0 || withoutDate;

    if (!hasChanges) {
      handleOpenChange(false);
      return;
    }

    try {
      const result = await saveMutation.mutateAsync({
        recipeId,
        householdId,
        datesToAdd,
        planIdsToRemove,
        addWithoutDate: withoutDate,
      });

      toast.success(t("recipe.planningSuccessful"), {
        position: "top-right",
        richColors: true,
      });

      handleOpenChange(false);
      onSaveComplete?.({ success: true, ...result });

      if (navigateOnSuccess) {
        navigate("/planner");
      }
    } catch {
      toast.error(t("recipe.planningFailed"), {
        position: "top-right",
        richColors: true,
      });
      onSaveComplete?.({ success: false, added: 0, removed: 0 });
    }
  }

  const defaultTrigger = (
    <Button className="w-full" variant="accent">
      <CalendarDays />
      {t("recipe.planRecipe")}
    </Button>
  );

  const dialogContent = (
    <DialogContent className="sm:max-w-[425px]">
      <DialogTitle className="flex items-center gap-2">
        <CalendarDays size={20} />
        <span className="truncate">{recipeName}</span>
      </DialogTitle>

      <div className="flex flex-col gap-2">
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
          // Use the fresh plannedItems data to check if this recipe is planned
          const hasExistingPlan = isDatePlannedForThisRecipe(day);

          return (
            <Button
              key={day.toISOString()}
              variant="outline"
              onClick={() => toggleWeekDate(day)}
              className={`h-auto min-h-10 py-2 flex flex-col items-start gap-1 ${
                isSelected
                  ? "bg-accent text-accent-foreground ring-2 ring-primary"
                  : hasExistingPlan
                  ? "border-destructive border-2"
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
                        locales[i18n.language as keyof typeof locales] || enUS,
                    })}
                  </span>
                </div>

                {hasPlannedItems && (
                  <span className="text-xs text-muted-foreground">
                    {plannedForDay.length} {t("mealPlanner.planned")}
                  </span>
                )}
              </div>

              {/* Show existing plan indicator for this recipe */}
              {hasExistingPlan && (
                <span
                  className={`text-xs ${
                    isSelected ? "text-accent-foreground" : "text-destructive"
                  }`}
                >
                  {isSelected
                    ? t("mealPlanner.alreadyPlanned")
                    : t("mealPlanner.willBeRemoved")}
                </span>
              )}

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
        <Button
          className="mt-4"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </DialogContent>
  );

  // If trigger is null, render without trigger (controlled mode)
  if (trigger === null) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        {dialogContent}
      </Dialog>
    );
  }

  // Render with trigger (default or custom)
  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
