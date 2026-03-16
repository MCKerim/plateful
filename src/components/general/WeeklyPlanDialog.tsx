import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { getWeekdays } from "@/lib/dateHelper/dateHelper";
import { format, isSameDay, addWeeks, subWeeks, isSameWeek } from "date-fns";
import { enUS, es, fr, de } from "date-fns/locale";
import { useSwipe } from "@/hooks/useSwipe";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { usePlannedItemsSummary } from "@/hooks/meal-planning/usePlannedItemsSummary";
import { useRecipePlansForWeek } from "@/hooks/meal-planning/useRecipePlansForWeek";
import { useSaveRecipePlans } from "@/hooks/meal-planning/useSaveRecipePlans";

type Props = {
  recipeId: string;
  recipeName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode | null;
  onSaveComplete?: (result: { success: boolean; added: number; removed: number }) => void;
  navigateOnSuccess?: boolean;
  initialWeek?: Date;
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
    (item) => item.planned_date && isSameDay(new Date(item.planned_date), date)
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
  initialWeek,
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
  const [withoutDateCount, setWithoutDateCount] = useState(1);
  const [currentWeek, setCurrentWeek] = useState(initialWeek ?? new Date());
  // Track which weeks have been initialized (by week start date ISO string)
  const [initializedWeeks, setInitializedWeeks] = useState<Set<string>>(new Set());
  // Track original plan IDs per initialized week (needed for cross-week deletes)
  const [planIdsByWeek, setPlanIdsByWeek] = useState<
    Map<string, Array<{ id: string; date: Date }>>
  >(new Map());

  // Fetch all planned items summary (for showing recipes on each day - includes recipe names)
  const { data: plannedItems = [], isFetching: isFetchingPlannedItems } = usePlannedItemsSummary(
    currentWeek,
    isDialogOpen
  );

  // Fetch existing plans for THIS recipe in the current week (needed for IDs to delete)
  const { data: recipePlans = [], isFetching: isFetchingRecipePlans } = useRecipePlansForWeek(
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

  // Reset state when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setSelectedDates([]);
      setWithoutDate(false);
      setWithoutDateCount(1);
      setCurrentWeek(initialWeek ?? new Date());
      setInitializedWeeks(new Set());
      setPlanIdsByWeek(new Map());
    }
  }, [isDialogOpen]);

  // Reset when recipe changes
  useEffect(() => {
    setSelectedDates([]);
    setWithoutDate(false);
    setCurrentWeek(initialWeek ?? new Date());
    setInitializedWeeks(new Set());
    setPlanIdsByWeek(new Map());
  }, [recipeId]);

  // Initialize/update selected dates when week changes or data loads
  // This adds already-planned dates for weeks that haven't been initialized yet
  useEffect(() => {
    // Don't initialize while data is still being fetched for this week
    if (!isDialogOpen || isFetchingPlannedItems || isFetchingRecipePlans) return;

    const weekKey = getWeekdays(currentWeek)[0].toISOString();

    // Skip if this week has already been initialized
    if (initializedWeeks.has(weekKey)) return;

    // Find all days in current week that have this recipe planned
    const weekDays = getWeekdays(currentWeek);
    const alreadyPlannedDates = weekDays.filter((day) => isDatePlannedForThisRecipe(day));

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

    // Store plan IDs for this week (needed for cross-week deletes on save)
    setPlanIdsByWeek((prev) => {
      const updated = new Map(prev);
      updated.set(
        weekKey,
        recipePlans
          .filter((p) => p.planned_date)
          .map((p) => ({ id: p.id, date: p.planned_date! }))
      );
      return updated;
    });

    // Mark this week as initialized
    setInitializedWeeks((prev) => new Set(prev).add(weekKey));
  }, [
    isDialogOpen,
    plannedItems,
    currentWeek,
    initializedWeeks,
    recipeName,
    isFetchingPlannedItems,
    isFetchingRecipePlans,
    recipePlans,
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

  const swipeHandlers = useSwipe({
    onSwipeLeft: goToNextWeek,
    onSwipeRight: goToPreviousWeek,
  });

  function goToCurrentWeek() {
    setCurrentWeek(new Date());
  }

  function toggleWeekDate(date: Date) {
    setSelectedDates((prev) =>
      prev.some((d) => isSameDay(d, date))
        ? prev.filter((d) => !isSameDay(d, date))
        : [...prev, date]
    );
  }

  function toggleWithoutDate() {
    setWithoutDate((prev) => !prev);
    setWithoutDateCount(1);
  }

  async function handleSave() {
    if (!householdId) {
      toast.error(t("common.error"));
      return;
    }

    // Process all initialized weeks to compute adds/removes across week navigation
    const planIdsToRemove: string[] = [];
    const datesToAdd: Date[] = [];

    for (const [weekKey, originalPlans] of planIdsByWeek.entries()) {
      const weekStart = new Date(weekKey);
      const weekDays = getWeekdays(weekStart);

      const selectedInThisWeek = selectedDates.filter((d) =>
        weekDays.some((wd) => isSameDay(wd, d))
      );

      // Plans that were originally there but are now deselected → remove
      for (const plan of originalPlans) {
        if (!selectedInThisWeek.some((d) => isSameDay(d, plan.date))) {
          planIdsToRemove.push(plan.id);
        }
      }

      // Dates that are selected but weren't originally planned → add
      for (const date of selectedInThisWeek) {
        if (!originalPlans.some((p) => isSameDay(p.date, date))) {
          datesToAdd.push(date);
        }
      }
    }

    // Only show error if nothing is selected AND there's nothing to remove (i.e., no changes)
    if (selectedDates.length === 0 && !withoutDate && planIdsToRemove.length === 0) {
      toast.error(t("mealPlanner.selectDayOrWithoutDate"));
      return;
    }

    // Check if there are actual changes
    const hasChanges = planIdsToRemove.length > 0 || datesToAdd.length > 0 || withoutDate;

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
        withoutDateCount: withoutDate ? withoutDateCount : 0,
      });

      toast.success(t("recipe.planningSuccessful"));

      handleOpenChange(false);
      onSaveComplete?.({ success: true, ...result });

      if (navigateOnSuccess) {
        navigate("/planner");
      }
    } catch {
      toast.error(t("recipe.planningFailed"));
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
    <DialogContent>
      <div className="flex flex-col gap-2">
        {/* Week Navigation */}
        <div className="sticky flex items-center justify-between px-2 pb-2 h-[68px] pt-4 bg-background">
          <Button variant="ghost" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft size={20} />
          </Button>

          <div className="flex flex-col items-center">
            <h2 className="text-lg font-bold second-font">
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
                className="h-auto p-0 text-xs text-muted-foreground italic"
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
        <div className="flex flex-col gap-2" {...swipeHandlers}>
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
                  ? "bg-accent text-accent-foreground border-accent"
                  : hasExistingPlan
                    ? "border-destructive"
                    : ""
              }`}
            >
              <p className="font-bold">
                {format(day, "EEE - dd.MM", {
                  locale: locales[i18n.language as keyof typeof locales] || enUS,
                })}

                {isToday && ` - ${t("common.today")}`}
              </p>

              {/* Show planned items */}
              {hasPlannedItems && (
                <div className="w-full flex flex-wrap gap-1 pl-2">
                  {plannedForDay.map((item, index) => (
                    <p
                      key={index}
                      className="text-xs px-2 py-0.5 rounded-sm bg-muted text-muted-foreground second-font font-semibold truncate max-w-[120px]"
                    >
                      {item.recipe_name}
                    </p>
                  ))}
                </div>
              )}
            </Button>
          );
        })}
        </div>

        {/* Without Date Button */}
        <Button
          variant="secondary"
          className={withoutDate ? "bg-accent text-accent-foreground" : ""}
          onClick={toggleWithoutDate}
        >
          {t("mealPlanner.noDate")}
        </Button>

        {/* Day count selector */}
        {withoutDate && (
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={withoutDateCount <= 1}
              onClick={() => setWithoutDateCount((c) => Math.max(1, c - 1))}
            >
              <Minus size={16} />
            </Button>
            <span className="text-lg font-semibold text-center">
              {withoutDateCount} {withoutDateCount === 1 ? t("common.day") : t("common.days")}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={withoutDateCount >= 10}
              onClick={() => setWithoutDateCount((c) => Math.min(10, c + 1))}
            >
              <Plus size={16} />
            </Button>
          </div>
        )}

        {/* Save Button */}
        <Button className="mt-4" onClick={handleSave} disabled={saveMutation.isPending}>
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
