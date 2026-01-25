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
import {
  format,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
  isSameWeek,
} from "date-fns";
import RatingModal, { RatingModalRef } from "@/components/general/RatingModal";
import MealPlannerAdd from "@/components/general/MealPlannerAdd";
import WeeklyPlanDialog from "@/components/general/WeeklyPlanDialog";
import { getWeekdays } from "@/lib/dateHelper/dateHelper";
import { Button } from "@/components/ui/button";
import {
  CalendarOff,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
import { useSetDaysEaten } from "@/hooks/meal-planning/useSetDaysEaten";
import { useUpdatePlannedItemDate } from "@/hooks/meal-planning/useUpdatePlannedItemDate";
import { MealPlannerItem as MealPlannerItemType } from "@/types/meal-planning.types";
import MealPlannerItemSkeleton from "@/components/mealPlanner/mealPlannerItem/MealPlannerItemSkeleton";

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
  const [activeItem, setActiveItem] = useState<MealPlannerItemType | null>(
    null,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const ratingModalRef = useRef<RatingModalRef>(null);
  const [recipeToRate, setRecipeToRate] = useState<number>();
  const [editingRecipe, setEditingRecipe] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // React Query hooks - clean and simple!
  const { data: plannedItems = [], isLoading } =
    useMealPlannerItems(currentWeek);
  const deleteMutation = useDeletePlannedItem();
  const updateDateMutation = useUpdatePlannedItemDate();
  const setDaysEatenMutation = useSetDaysEaten();

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
    }),
  );

  // Derived state
  const notPlannedItems = plannedItems.filter(
    (item) => item.planned_date === null && item.daysEaten < item.days,
  );
  const isDraggingFromDrawer = activeItem?.planned_date === null;

  // Auto-open drawer when there are unplanned items
  useEffect(() => {
    setIsDrawerOpen(notPlannedItems.length > 0);
  }, [notPlannedItems.length]);

  // Handlers
  function handleDelete(id: number) {
    deleteMutation.mutate(id, {
      onError: () => toast.error(t("mealPlanner.deleteError")),
    });
  }

  function handleUpdateDate(id: number, newDate: Date | null, newDays: number) {
    updateDateMutation.mutate(
      { id, newDate, newDays },
      {
        onSuccess: () => toast.success(t("recipe.planningSuccessful")),
        onError: () => toast.error(t("recipe.planningFailed")),
      },
    );
  }

  function handleSetDaysEaten(id: number, newDaysEaten: number) {
    setDaysEatenMutation.mutate(
      { id, newDaysEaten },
      {
        onError: () => toast.error(t("mealPlanner.updateError")),
      },
    );
  }

  function handleRecipeEaten(item: MealPlannerItemType) {
    handleSetDaysEaten(item.id, item.daysEaten + 1);
    setRecipeToRate(item.recipeId);
    ratingModalRef.current?.open();
  }

  function handleEditPlan(recipeId: number, recipeName: string) {
    setEditingRecipe({ id: recipeId, name: recipeName });
  }

  function getItemsByDate(date: Date) {
    return plannedItems.filter(
      (item) => item.planned_date && isSameDay(item.planned_date, date),
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

  function showRateRecipeModal(recipeId: number) {
    setRecipeToRate(recipeId);
    ratingModalRef.current?.open();
  }

  function goToPreviousWeek() {
    dispatch(setCurrentWeek(subWeeks(currentWeek, 1).toISOString()));
  }

  function goToNextWeek() {
    dispatch(setCurrentWeek(addWeeks(currentWeek, 1).toISOString()));
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
        handleUpdateDate(activeItem.id, null, 1);
      }
    } else {
      const targetDate = new Date(targetId);
      if (
        !activeItem.planned_date ||
        !isSameDay(activeItem.planned_date, targetDate)
      ) {
        // Close drawer if it will be empty
        if (isDraggingFromDrawer && notPlannedItems.length === 1) {
          setIsDrawerOpen(false);
        }
        handleUpdateDate(activeItem.id, targetDate, activeItem.days);
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
    threshold: 50,
    disabled: activeItem !== null,
  });

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
      <Layout>
        <RatingModal
          ref={ratingModalRef}
          recipeId={recipeToRate}
          showTriggerButton={false}
        />

        {/* Weekly Plan Dialog for editing */}
        <WeeklyPlanDialog
          recipeId={editingRecipe?.id ?? 0}
          recipeName={editingRecipe?.name ?? ""}
          open={editingRecipe !== null}
          onOpenChange={(open) => !open && setEditingRecipe(null)}
          trigger={null}
          navigateOnSuccess={false}
        />

        {/* Week Navigation */}
        <div className="sticky flex items-center justify-between px-2 pb-1 border-b bg-background top-11 z-10">
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
                    "dd.MM",
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

            {isSameWeek(currentWeek, new Date()) && (
              <div className="h-[16px]"></div>
            )}
          </div>

          <Button variant="ghost" size="sm" onClick={goToNextWeek}>
            <ChevronRight size={20} />
          </Button>
        </div>

        {/* Calendar Days */}
        <div
          className="flex flex-col gap-1 mb-48"
          {...swipeHandlers}
        >
          {isLoading ? (
            <>
              {[new Array(7)].map((_, index) => (
                <DayCardSkeleton key={index} />
              ))}
            </>
          ) : (
            getWeekdays(currentWeek).map((day) => (
              <DroppableDay key={day.toISOString()} id={day.toISOString()}>
                <p
                  className={`px-1.5 mb-1 text-sm font-semibold rounded-full w-fit ${
                    isToday(day) ? "bg-accent text-accent-foreground" : ""
                  }`}
                >
                  {format(day, "EEE - dd.MM", {
                    locale:
                      locales[i18n.language as keyof typeof locales] || enUS,
                  })}
                </p>

                {getItemsByDate(day).length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {getItemsByDate(day).map((item) => (
                      <li key={item.id}>
                        <MealPlannerItem
                          {...item}
                          setDaysEaten={(d) => handleSetDaysEaten(item.id, d)}
                          onRecipeEaten={() => handleRecipeEaten(item)}
                          onRecipeDelete={() => handleDelete(item.id)}
                          onEditPlan={() =>
                            handleEditPlan(item.recipeId, item.recipeName)
                          }
                          isDragging={activeItem?.id === item.id}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <MealPlannerAdd onClick={() => navigate("/cookbook")} />
                )}
              </DroppableDay>
            ))
          )}
        </div>

        {/* Bottom Drawer */}
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-background border-t max-w-lg mx-auto">
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
                          <MealPlannerItem
                            key={item.id}
                            id={item.id}
                            recipeId={item.recipeId}
                            recipeName={item.recipeName}
                            days={item.days}
                            daysEaten={item.daysEaten}
                            setDaysEaten={(days) =>
                              handleSetDaysEaten(item.id, days)
                            }
                            onRecipeEaten={() => {
                              handleRecipeEaten(item);
                              showRateRecipeModal(item.recipeId);
                            }}
                            onRecipeDelete={() => handleDelete(item.id)}
                            onEditPlan={() =>
                              handleEditPlan(item.recipeId, item.recipeName)
                            }
                            isDragging={activeItem?.id === item.id}
                          />
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
          <Card className="h-[72px] flex items-center shadow-2xl opacity-95 border-2 border-primary">
            <div className="h-full w-[74px] bg-muted border-r-4 border-background" />

            <div className="flex-1 px-2.5">
              <p className="second-font text-md font-semibold break-words leading-tight line-clamp-3">
                {activeItem.recipeName}
              </p>
            </div>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}
