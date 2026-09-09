import MealPlannerItem from "@/components/mealPlanner/mealPlannerItem/MealPlannerItem";
import Layout from "@/components/layout/Layout";
import { useEffect, useRef, useState } from "react";
import { useSwipe } from "@/hooks/useSwipe";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectCurrentWeek,
  setCurrentWeek,
  resetToCurrentWeek,
} from "@/redux/slices/mealPlannerSlice";
import { format, isSameDay, isToday, addWeeks, subWeeks, isSameWeek } from "date-fns";
import RatingModal, { RatingModalRef } from "@/components/general/RatingModal";
import MealPlannerAdd from "@/components/general/MealPlannerAdd";
import WeeklyPlanDialog from "@/components/general/WeeklyPlanDialog";
import { getWeekdays, weekStartsOn } from "@/lib/dateHelper/dateHelper";
import { useWeekStart } from "@/hooks/user/useWeekStart";
import { Button } from "@/components/ui/button";
import {
  CalendarOff,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  StickyNote,
} from "lucide-react";
import { useNavigate } from "react-router";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  DragOverlay,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { enUS, es, fr, de } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { restrictToVerticalAxisAndWindow } from "@/lib/dnd-modifiers";
import { DroppableNoDateZone } from "@/components/mealPlanner/droppableNoDateZone/DroppableNoDateZone";
import { DroppableDay } from "@/components/mealPlanner/droppableDay/DroppableDay";
import { useDeletePlannedItem } from "@/hooks/meal-planning/useDeletePlannedItem";
import { useMealPlannerItems } from "@/hooks/meal-planning/useMealPlannerItems";
import { useSetEaten } from "@/hooks/meal-planning/useSetDaysEaten";
import { useUpdatePlannedItemDate } from "@/hooks/meal-planning/useUpdatePlannedItemDate";
import {
  MealPlannerItem as MealPlannerItemType,
  PlannedNote,
  PlannedRecipe,
  PlanSubject,
} from "@/types/meal-planning.types";
import MealPlannerItemSkeleton from "@/components/mealPlanner/mealPlannerItem/MealPlannerItemSkeleton";
import OnboardingSheet from "@/components/onboarding/OnboardingSheet";
import MealPlannerIllustration from "@/components/onboarding/illustrations/MealPlannerIllustration";
import PlannerEntryChooser from "@/components/mealPlanner/plannerEntryChooser/PlannerEntryChooser";
import NoteDialog, { NoteDialogState } from "@/components/mealPlanner/noteDialog/NoteDialog";
import { orderForDisplay, planSubjectOf } from "@/lib/mealPlanHelper/mealPlanHelper";

const locales = {
  en: enUS,
  es: es,
  fr: fr,
  de: de,
};

function DayCardSkeleton() {
  return (
    <div className="p-1 min-h-[50px]">
      <Skeleton className="h-5 w-24 mb-2 rounded-full" />

      <MealPlannerItemSkeleton />
    </div>
  );
}

export default function MealPlanner() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const currentWeek = useAppSelector(selectCurrentWeek);
  // The account's first weekday: every week here, and the "this week" test
  // (date-fns counts from Sunday unless told), runs on it.
  const firstWeekday = useWeekStart();
  const shownWeekIs = (date: Date) =>
    isSameWeek(currentWeek, date, { weekStartsOn: weekStartsOn(firstWeekday) });
  const [activeItem, setActiveItem] = useState<MealPlannerItemType | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);

  const ratingModalRef = useRef<RatingModalRef>(null);
  const [recipeToRate, setRecipeToRate] = useState<string>();
  /** The recipe or note whose weekly plan dialog is open. */
  const [editingSubject, setEditingSubject] = useState<PlanSubject | null>(null);
  /** The day whose "+" opened the recipe-or-note chooser. */
  const [chooserDay, setChooserDay] = useState<Date | null>(null);
  const [noteDialog, setNoteDialog] = useState<NoteDialogState | null>(null);

  // React Query hooks - clean and simple!
  const { data: plannedItems = [], isLoading } = useMealPlannerItems(currentWeek);
  const deleteMutation = useDeletePlannedItem();
  const updateDateMutation = useUpdatePlannedItemDate();
  const setEatenMutation = useSetEaten();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Derived state. Eaten pool recipes are done with; a note has no such state.
  const notPlannedItems = orderForDisplay(
    plannedItems.filter(
      (item) => item.planned_date === null && (item.kind === "note" || !item.eaten)
    )
  );
  const isDraggingFromDrawer = activeItem?.planned_date === null;

  // Auto-open drawer when there are unplanned items
  useEffect(() => {
    setIsDrawerOpen(notPlannedItems.length > 0);
  }, [notPlannedItems.length]);

  // Reset scroll position when page opens or week changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentWeek]);

  // Handlers
  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onError: () => toast.error(t("mealPlanner.deleteError")),
    });
  }

  function handleUpdateDate(id: string, newDate: Date | null) {
    updateDateMutation.mutate(
      { id, newDate },
      {
        onSuccess: () => toast.success(t("recipe.planningSuccessful")),
        onError: () => toast.error(t("recipe.planningFailed")),
      }
    );
  }

  function handleSetEaten(id: string, eaten: boolean) {
    setEatenMutation.mutate(
      { id, eaten },
      {
        onError: () => toast.error(t("mealPlanner.updateError")),
      }
    );
  }

  function handleRecipeEaten(item: PlannedRecipe) {
    handleSetEaten(item.id, true);
    setRecipeToRate(item.recipeId);
    ratingModalRef.current?.open();
  }

  function handleToggleEaten(item: PlannedRecipe) {
    if (item.eaten) {
      handleSetEaten(item.id, false);
    } else {
      handleRecipeEaten(item);
    }
  }

  function handleEditPlan(item: MealPlannerItemType) {
    setEditingSubject(planSubjectOf(item));
  }

  function handleEditNote(note: PlannedNote) {
    setNoteDialog({ mode: "edit", note });
  }

  function getItemsByDate(date: Date) {
    return orderForDisplay(
      plannedItems.filter((item) => item.planned_date && isSameDay(item.planned_date, date))
    );
  }

  useEffect(() => {
    if (activeItem === null) {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";

      const mainContent = document.querySelector("main");
      if (mainContent) {
        mainContent.style.overflow = "";
      }
    } else {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";

      const mainContent = document.querySelector("main");
      if (mainContent) {
        mainContent.style.overflow = "hidden";
      }
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      const mainContent = document.querySelector("main");
      if (mainContent) {
        mainContent.style.overflow = "";
      }
    };
  }, [activeItem]);

  function goToPreviousWeek() {
    setSlideDirection("right");
    dispatch(setCurrentWeek(subWeeks(currentWeek, 1).toISOString()));
    setTimeout(() => setSlideDirection(null), 300);
  }

  function goToNextWeek() {
    setSlideDirection("left");
    dispatch(setCurrentWeek(addWeeks(currentWeek, 1).toISOString()));
    setTimeout(() => setSlideDirection(null), 300);
  }

  function goToCurrentWeek() {
    dispatch(resetToCurrentWeek());
  }

  // DnD handlers
  function handleDragStart(event: DragStartEvent) {
    const item = plannedItems.find((i) => i.id === event.active.id);
    if (item) setActiveItem({ ...item });
  }

  function handleDragOver(event: DragOverEvent) {
    if (event.over?.id === "no-date-zone") setIsDrawerOpen(true);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { over } = event;
    if (!over || !activeItem) {
      setActiveItem(null);
      return;
    }

    const targetId = over.id as string;

    if (targetId === "no-date-zone") {
      if (activeItem.planned_date !== null) {
        handleUpdateDate(activeItem.id, null);
      }
    } else {
      const targetDate = new Date(targetId);
      if (!activeItem.planned_date || !isSameDay(activeItem.planned_date, targetDate)) {
        // Close drawer if it will be empty
        if (isDraggingFromDrawer && notPlannedItems.length === 1) {
          setIsDrawerOpen(false);
        }
        handleUpdateDate(activeItem.id, targetDate);
      }
    }

    setActiveItem(null);
  }

  function handleDragCancel() {
    setActiveItem(null);
  }

  const swipeHandlers = useSwipe({
    onSwipeLeft: goToNextWeek,
    onSwipeRight: goToPreviousWeek,
    disabled: activeItem !== null,
  });

  function renderItem(item: MealPlannerItemType, { inDay }: { inDay: boolean }) {
    return (
      <MealPlannerItem
        item={item}
        onToggleEaten={item.kind === "recipe" ? () => handleToggleEaten(item) : undefined}
        onRemove={() => handleDelete(item.id)}
        onEditPlan={() => handleEditPlan(item)}
        onEditNote={item.kind === "note" ? () => handleEditNote(item) : undefined}
        onMoveToNoDate={inDay ? () => handleUpdateDate(item.id, null) : undefined}
        isDragging={activeItem?.id === item.id}
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      modifiers={[restrictToVerticalAxisAndWindow]}
      autoScroll={{
        threshold: {
          x: 0,
          y: 0.15,
        },
        layoutShiftCompensation: false,
      }}
    >
      <Layout showHeader={false} noTopPadding>
        <RatingModal ref={ratingModalRef} recipeId={recipeToRate} showTriggerButton={false} />

        {/* Weekly Plan Dialog for editing a recipe's or a note's days */}
        <WeeklyPlanDialog
          subject={editingSubject}
          open={editingSubject !== null}
          onOpenChange={(open) => !open && setEditingSubject(null)}
          trigger={null}
          navigateOnSuccess={false}
          initialWeek={currentWeek}
        />

        {/* A day's "+": a recipe from the cookbook, or a note for the day */}
        <PlannerEntryChooser
          day={chooserDay}
          open={chooserDay !== null}
          onOpenChange={(open) => !open && setChooserDay(null)}
          onRecipe={() => navigate("/cookbook")}
          onNote={(day) => setNoteDialog({ mode: "create", day })}
        />

        <NoteDialog state={noteDialog} onClose={() => setNoteDialog(null)} />

        {/* Week Navigation */}
        <div className="sticky flex items-center justify-between px-2 pb-1 pt-4 border-b bg-background top-0 z-10">
          <Button variant="ghost" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft size={20} />
          </Button>

          <div className="flex flex-col items-center">
            <h2 className="text-lg font-semibold">
              {shownWeekIs(new Date())
                ? t("mealPlanner.thisWeek")
                : shownWeekIs(addWeeks(new Date(), 1))
                  ? t("mealPlanner.nextWeek")
                  : shownWeekIs(subWeeks(new Date(), 1))
                    ? t("mealPlanner.lastWeek")
                    : `${format(getWeekdays(currentWeek, firstWeekday)[0], "dd.MM")} - ${format(
                        getWeekdays(currentWeek, firstWeekday)[6],
                        "dd.MM"
                      )}`}
            </h2>

            {!shownWeekIs(new Date()) && (
              <Button
                variant="link"
                size="sm"
                onClick={goToCurrentWeek}
                className="h-auto p-0 text-xs text-muted-foreground italic"
              >
                {t("mealPlanner.goToCurrentWeek")}
              </Button>
            )}

            {shownWeekIs(new Date()) && <div className="h-[16px]"></div>}
          </div>

          <Button variant="ghost" size="sm" onClick={goToNextWeek}>
            <ChevronRight size={20} />
          </Button>
        </div>

        {/* Calendar Days */}
        <div className="overflow-x-hidden" {...swipeHandlers}>
          <div
            className={`flex flex-col gap-1 mb-48 ${
              slideDirection === "left"
                ? "animate-slide-left"
                : slideDirection === "right"
                  ? "animate-slide-right"
                  : ""
            }`}
          >
            {isLoading ? (
              <>
                {[new Array(7)].map((_, index) => (
                  <DayCardSkeleton key={index} />
                ))}
              </>
            ) : (
              getWeekdays(currentWeek, firstWeekday).map((day) => {
                const items = getItemsByDate(day);

                return (
                  <DroppableDay key={day.toISOString()} id={day.toISOString()}>
                    <div className="flex items-center justify-between mb-1">
                      <p
                        className={`px-1.5 text-sm font-semibold rounded-full w-fit ${
                          isToday(day) ? "bg-accent text-accent-foreground" : ""
                        }`}
                      >
                        {format(day, "EEE - dd.MM", {
                          locale: locales[i18n.language as keyof typeof locales] || enUS,
                        })}
                      </p>

                      {/* Only with entries on the day: an empty day's card is
                          the (bigger) add button itself. */}
                      {items.length > 0 && (
                        <Button
                          variant="ghost"
                          size="iconSm"
                          className="text-muted-foreground"
                          aria-label={t("mealPlanner.addToDay")}
                          onClick={() => setChooserDay(day)}
                        >
                          <Plus size={18} />
                        </Button>
                      )}
                    </div>

                    {items.length > 0 ? (
                      <ul className="flex flex-col gap-2">
                        {items.map((item) => (
                          <li key={item.id}>{renderItem(item, { inDay: true })}</li>
                        ))}
                      </ul>
                    ) : (
                      <MealPlannerAdd onClick={() => setChooserDay(day)} />
                    )}
                  </DroppableDay>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Drawer */}
        <div className="fixed bottom-16 left-0 right-0 z-30 bg-background border-t max-w-lg mx-auto">
          {/* Show drop zone when dragging from calendar */}
          {activeItem && !isDraggingFromDrawer && (
            <DroppableNoDateZone>
              <div className="flex items-center justify-center gap-2 p-4 text-muted-foreground">
                <CalendarOff size={20} />
                <span>{t("mealPlanner.dropToRemoveDate")}</span>
              </div>
            </DroppableNoDateZone>
          )}

          {/* Show drawer header and content when not dragging from calendar */}
          {(!activeItem || isDraggingFromDrawer) && (
            <>
              {/* Drawer Header */}
              <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CalendarOff size={20} />
                  <span className="font-medium">
                    {t("mealPlanner.noDate")} - {notPlannedItems.length}
                  </span>
                </div>
                <ChevronDown
                  size={20}
                  className={`transition-transform duration-200 ${
                    isDrawerOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Drawer Content */}
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isDrawerOpen ? "max-h-[200px]" : "max-h-0"
                }`}
              >
                <div className="p-2">
                  {isLoading ? (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {[new Array(2)].map((_, index) => (
                        <div key={index} className="flex-shrink-0 w-[280px]">
                          <MealPlannerItemSkeleton />
                        </div>
                      ))}
                    </div>
                  ) : notPlannedItems.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {notPlannedItems.map((item) => (
                        <div key={item.id} className="flex-shrink-0 w-[280px]">
                          {renderItem(item, { inDay: false })}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      {t("mealPlanner.noUnplannedRecipes")}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <OnboardingSheet
          storageKey="onboarding_mealplanner_seen"
          titleKey="onboarding.mealPlanner.title"
          bulletKeys={[
            "onboarding.mealPlanner.bullet1",
            "onboarding.mealPlanner.bullet2",
            "onboarding.mealPlanner.bullet3",
          ]}
          illustration={<MealPlannerIllustration />}
        />
      </Layout>

      <DragOverlay
        dropAnimation={{
          duration: 150,
          easing: "ease-out",
          keyframes() {
            return [{ opacity: 1 }, { opacity: 0 }];
          },
        }}
      >
        {activeItem && (
          <Card className="h-[72px] flex items-center shadow-2xl opacity-95">
            <div className="h-full w-[74px] bg-muted border-r-4 border-background flex items-center justify-center text-muted-foreground">
              {activeItem.kind === "note" && <StickyNote size={28} />}
            </div>

            <div className="flex-1 px-2.5">
              <p className="text-md font-semibold break-words leading-tight line-clamp-3">
                {activeItem.kind === "recipe" ? activeItem.recipeName : activeItem.text}
              </p>
            </div>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}
