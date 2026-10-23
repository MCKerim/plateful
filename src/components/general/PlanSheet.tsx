import { Fragment, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useQueries } from "@tanstack/react-query";
import { addWeeks, differenceInCalendarWeeks, isBefore, isToday, startOfToday } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, Minus, Plus, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import CheckMark from "@/components/general/CheckMark";
import RecipeCover from "@/components/shoppingList/RecipeCover";
import MealTypePicker from "@/components/mealPlanner/mealTypePicker/MealTypePicker";
import { useSupabase } from "@/utils/supabase";
import { randomId } from "@/utils/randomId";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { useWeekStart } from "@/hooks/user/useWeekStart";
import { useSwipe } from "@/hooks/useSwipe";
import { mealPlannerItemsQuery } from "@/hooks/meal-planning/useMealPlannerItems";
import { useApplyPlannerChanges } from "@/hooks/meal-planning/useApplyPlannerChanges";
import { useLastMealType } from "@/hooks/meal-planning/useLastMealType";
import { useIncrementMission } from "@/hooks/missions/useIncrementMission";
import { usePlannerTracking } from "@/hooks/analytics/usePlannerTracking";
import { contentLanguage } from "@/lib/contentLanguage";
import { cn } from "@/lib/utils";
import {
  getWeekdays,
  toPlannedDateString,
  weekStartsOn,
  weekTitle,
} from "@/lib/dateHelper/dateHelper";
import { orderForDisplay, preselectedMealType } from "@/lib/mealPlanHelper/mealPlanHelper";
import {
  dayState,
  diff,
  isOn,
  MAX_POOL_COUNT,
  NO_CHANGES,
  poolCount,
  poolState,
  saveAction,
  setPoolCount,
  toggleDay,
  togglePool,
  type Placement,
  type SaveAction,
  type SectionState,
} from "@/lib/mealPlanHelper/planChanges";
import type { MealPlannerItem, MealType, PlanSubject } from "@/types/meal-planning.types";

type Props = {
  /** The recipe or note to plan, given before the sheet opens where the caller knows it. */
  subject: PlanSubject | null;
  open: boolean;
  /** The week to open on (the planner's shown week); this week without one. */
  initialWeek?: Date;
  onClose: () => void;
};

/**
 * A recipe or a note onto any days of any week and into the pool, with the
 * household's plan in view: the native app's Plan sheet. No title and no
 * name, since it opens from the subject itself. The edits live in
 * `PlanChanges` on top of the plan, so every section's state is derived on
 * render; the save is one `apply_planner_changes` transaction.
 */
export default function PlanSheet({ subject, open, initialWeek, onClose }: Readonly<Props>) {
  const { t } = useTranslation();
  // Keeps the content while the sheet slides away.
  const [shown, setShown] = useState(subject);
  if (subject && subject !== shown) setShown(subject);
  // Loaded while the sheet is still closed where the subject is known (the
  // recipe page), so it opens on the right type instead of moving to it.
  const { data: lastMealType = null } = useLastMealType(shown?.kind === "recipe" ? shown.id : null);

  return (
    <Drawer open={open && subject !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent handle={false} className="h-[92dvh]" aria-describedby={undefined}>
        <DrawerTitle className="sr-only">{t("recipe.plan")}</DrawerTitle>
        {shown && (
          <Editor
            subject={shown}
            lastMealType={lastMealType}
            initialWeek={initialWeek}
            onClose={onClose}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}

/** Where the sheet is in time: weeks away from this one, every week opened so far, and which way the last change went. */
type WeekNav = { offset: number; visited: number[]; slide: "left" | "right" | null };

function jumped(nav: WeekNav, target: number): WeekNav {
  if (target === nav.offset) return nav;
  return {
    offset: target,
    visited: nav.visited.includes(target) ? nav.visited : [...nav.visited, target],
    slide: target > nav.offset ? "left" : "right",
  };
}

const SLIDE = { left: "animate-slide-left", right: "animate-slide-right" } as const;

/** The planner's day card per state: the drop-target look where saving inserts, a red ring where it deletes. */
const CARD: Record<SectionState, string> = {
  off: "bg-card",
  kept: "bg-card",
  added: "bg-accent/10 ring-2 ring-inset ring-accent/80",
  removed: "bg-card ring-2 ring-inset ring-destructive/80",
};

function saveLabel(action: SaveAction, t: TFunction): string {
  switch (action.kind) {
    case "planDays":
      return t("plan.planDays", { count: action.days });
    case "addToPool":
      return t("plan.addToPool");
    case "update":
    case "none":
      return t("plan.update");
  }
}

function dayKeyOf(item: MealPlannerItem): string | null {
  return item.planned_date && toPlannedDateString(item.planned_date);
}

/** Mounted with the sheet's content, so every opening starts on the plan as it stands. */
function Editor({
  subject,
  lastMealType,
  initialWeek,
  onClose,
}: Readonly<{
  subject: PlanSubject;
  /** The recipe's last stored meal type, the first link of the preselection. */
  lastMealType: string | null;
  initialWeek?: Date;
  onClose: () => void;
}>) {
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const householdId = useAppSelector(selectHouseholdId);
  const firstWeekday = useWeekStart();
  const locale = contentLanguage();
  const [today] = useState(() => new Date());
  const [nav, setNav] = useState<WeekNav>(() => {
    const offset = initialWeek
      ? differenceInCalendarWeeks(initialWeek, today, { weekStartsOn: weekStartsOn(firstWeekday) })
      : 0;
    return { offset, visited: [offset], slide: null };
  });
  const [changes, setChanges] = useState(NO_CHANGES);
  // The type the user picked here; until then the preselection, which can
  // still move while the last choice loads.
  const [pickedMealType, setPickedMealType] = useState<MealType | null>(null);
  const [isCovered, setIsCovered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // The insertion ids of the pending save, kept while its diff is unchanged:
  // a retry after a lost response then lands on the same rows instead of
  // planning a day twice (the RPC ignores an id it already has).
  const insertionIds = useRef<{ signature: string; ids: string[] }>({ signature: "", ids: [] });

  const weekOf = (offset: number) => addWeeks(today, offset);
  const weekQueries = useQueries({
    queries: nav.visited.map((offset) =>
      mealPlannerItemsQuery(supabase, weekOf(offset), firstWeekday)
    ),
  });
  // Every visited week's rows (each holds the pool too), once each; the
  // most recently fetched copy of a row wins.
  const rows = [
    ...new Map(
      [...weekQueries]
        .sort((a, b) => a.dataUpdatedAt - b.dataUpdatedAt)
        .flatMap((query) => query.data ?? [])
        .map((row) => [row.id, row])
    ).values(),
  ];
  // Until every visited week is in, a tap could act on a plan not yet seen
  // (the pool's toggle would read copies still loading as none).
  const isLoaded = weekQueries.every((query) => query.data !== undefined);
  const failedWeeks = weekQueries.filter((query) => query.isError && query.data === undefined);

  const isSubject = (item: MealPlannerItem) =>
    subject.kind === "recipe"
      ? item.kind === "recipe" && item.recipeId === subject.id
      : item.kind === "note" && item.noteId === subject.noteId;
  const placements: Placement[] = rows.filter(isSubject).map((item) => ({
    id: item.id,
    day: dayKeyOf(item),
    eaten: item.kind === "recipe" && item.eaten,
  }));
  const poolCopies = placements.filter(
    (placement) => placement.day === null && !placement.eaten
  ).length;
  const poolSection = poolState(changes, poolCopies);
  const waiting = rows.filter(
    (item) => item.planned_date === null && (item.kind === "note" || !item.eaten)
  ).length;

  // Only a recipe has a meal type; a note's placements are written without one.
  const mealType =
    subject.kind === "recipe"
      ? (pickedMealType ?? preselectedMealType(lastMealType, subject.tags))
      : null;
  const { trackMealTypeSet } = usePlannerTracking();
  const incrementMission = useIncrementMission();
  const applyChanges = useApplyPlannerChanges({
    onSuccess: (result, variables) => {
      // Planning a note is not planning a meal.
      if (variables.subject.kind === "recipe" && result.added > 0) {
        incrementMission.mutate({ missionId: "plan_meals", count: result.added });
      }
    },
  });
  const save = diff(changes, placements);
  const action = saveAction(changes, placements);

  function jump(target: number) {
    setNav((current) => jumped(current, target));
    scrollRef.current?.scrollTo({ top: 0 });
  }

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => jump(nav.offset + 1),
    onSwipeRight: () => jump(nav.offset - 1),
  });

  async function handleSave() {
    if (!householdId) {
      toast.error(t("common.error"));
      return;
    }
    const signature = JSON.stringify(save);
    if (insertionIds.current.signature !== signature) {
      insertionIds.current = { signature, ids: save.insertTargets.map(() => randomId()) };
    }
    // Only these new rows get the type; existing placements keep theirs.
    const insertions = save.insertTargets.map((planned_date, index) => ({
      id: insertionIds.current.ids[index],
      planned_date,
      meal_type: mealType,
    }));
    try {
      await applyChanges.mutateAsync({
        householdId,
        subject,
        insertions,
        deleteIds: save.deleteIds,
      });
    } catch {
      // The sheet stays with its choices, so a retry is one tap.
      toast.error(
        subject.kind === "recipe" ? t("recipe.planningFailed") : t("mealPlanner.planUpdateFailed")
      );
      return;
    }
    if (subject.kind === "recipe" && pickedMealType && insertions.length > 0) {
      trackMealTypeSet(pickedMealType, subject.tags);
    }
    toast.success(
      subject.kind === "recipe" ? t("recipe.planningSuccessful") : t("mealPlanner.planUpdated")
    );
    onClose();
  }

  const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const dateFormat = new Intl.DateTimeFormat(locale, { day: "numeric", month: "numeric" });
  const longDateFormat = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const slide = nav.slide && SLIDE[nav.slide];
  const subjectRow = (struck: boolean, accessory?: ReactNode) =>
    subject.kind === "recipe" ? (
      <EntryRow title={subject.name} coverUrl={subject.coverUrl} struck={struck}>
        {accessory}
      </EntryRow>
    ) : (
      <EntryRow title={subject.text} isNote struck={struck}>
        {accessory}
      </EntryRow>
    );

  return (
    <>
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-2 border-b px-5 pb-2.5 pt-4 transition-colors",
          !isCovered && "border-transparent"
        )}
      >
        <Button
          variant="secondary"
          size="icon"
          className="size-9 shrink-0 rounded-full"
          aria-label={t("mealPlanner.previousWeekButton")}
          onClick={() => jump(nav.offset - 1)}
        >
          <ChevronLeft />
        </Button>
        {/* A tap on the title is the way back to this week. */}
        <button
          type="button"
          className="min-w-0 overflow-hidden text-lg font-semibold"
          onClick={() => jump(0)}
        >
          <span key={nav.offset} className={cn("block truncate", slide)}>
            {weekTitle(weekOf(nav.offset), firstWeekday, t, today)}
          </span>
        </button>
        <Button
          variant="secondary"
          size="icon"
          className="size-9 shrink-0 rounded-full"
          aria-label={t("mealPlanner.nextWeekButton")}
          onClick={() => jump(nav.offset + 1)}
        >
          <ChevronRight />
        </Button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 pb-6 pt-1"
        onScroll={(event) => setIsCovered(event.currentTarget.scrollTop > 0)}
      >
        {mealType && <MealTypePicker value={mealType} onChange={setPickedMealType} />}

        {/* Dateless, so outside the week's slide, as in the planner. */}
        <PlanSection
          label={t("plan.pool")}
          state={poolSection}
          header={
            <>
              <span className="font-semibold">{t("plan.pool")}</span>
              {waiting > 0 && (
                <span className="text-sm text-muted-foreground">
                  {t("plan.entries", { count: waiting })}
                </span>
              )}
            </>
          }
          rows={
            poolSection === "off"
              ? []
              : [
                  {
                    key: "subject",
                    node: subjectRow(
                      poolSection === "removed",
                      isOn(poolSection) && (
                        <PoolCounter
                          count={poolCount(changes, poolCopies)}
                          onCount={(count) =>
                            setChanges((current) => setPoolCount(current, count, poolCopies))
                          }
                        />
                      )
                    ),
                  },
                ]
          }
          disabled={!isLoaded}
          onToggle={() => setChanges((current) => togglePool(current, poolCopies))}
        />

        {/* The gutters take the swipe too. */}
        <div className="-mx-5 overflow-x-clip px-5" {...swipeHandlers}>
          <div key={nav.offset} className={cn("flex flex-col gap-6", slide)}>
            {getWeekdays(weekOf(nav.offset), firstWeekday).map((day) => {
              const key = toPlannedDateString(day);
              const entries = orderForDisplay(rows.filter((item) => dayKeyOf(item) === key));
              const planned = placements.some((placement) => placement.day === key);
              const state = dayState(changes, key, planned);
              const sectionRows = entries.map((item) => ({
                key: item.id,
                node: (
                  <EntryRow
                    title={item.kind === "recipe" ? item.recipeName : item.text}
                    coverUrl={item.kind === "recipe" ? item.coverUrl : null}
                    isNote={item.kind === "note"}
                    // Cooked meals and past notes recede, as in the planner.
                    dimmed={item.kind === "recipe" ? item.eaten : isBefore(day, startOfToday())}
                    struck={state === "removed" && isSubject(item)}
                  />
                ),
              }));
              if (state === "added") sectionRows.push({ key: "subject", node: subjectRow(false) });
              return (
                <PlanSection
                  key={key}
                  label={longDateFormat.format(day)}
                  state={state}
                  dimHeader={isBefore(day, startOfToday())}
                  header={
                    <>
                      <span className="font-semibold">{weekdayFormat.format(day)}</span>
                      <span className="text-sm text-muted-foreground">
                        {dateFormat.format(day)}
                      </span>
                      {isToday(day) && (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                          {t("common.today")}
                        </span>
                      )}
                    </>
                  }
                  rows={sectionRows}
                  disabled={!isLoaded}
                  onToggle={() => setChanges((current) => toggleDay(current, key, planned))}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="shrink-0 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2.5">
        {failedWeeks.length > 0 && (
          <div className="mb-2 flex items-center justify-center gap-3 text-sm text-muted-foreground">
            {t("plan.loadFailed")}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => failedWeeks.forEach((query) => void query.refetch())}
            >
              {t("common.retry")}
            </Button>
          </div>
        )}
        <Button
          variant="accent"
          className="h-12 w-full rounded-full text-base font-semibold disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
          disabled={action.kind === "none" || !isLoaded || applyChanges.isPending}
          onClick={() => void handleSave()}
        >
          {applyChanges.isPending ? <Loader2 className="animate-spin" /> : saveLabel(action, t)}
        </Button>
      </div>
    </>
  );
}

/**
 * A day or the pool: its header and a card of rows, the whole of it one
 * toggle. The button lies over the section rather than around it, so the
 * rows stay readable on their own and the pool's counter can sit above it;
 * its z-index keeps it over the dimmed rows, whose opacity stacks them.
 */
function PlanSection({
  label,
  state,
  header,
  dimHeader = false,
  rows,
  disabled,
  onToggle,
}: Readonly<{
  label: string;
  state: SectionState;
  header: ReactNode;
  dimHeader?: boolean;
  rows: { key: string; node: ReactNode }[];
  disabled: boolean;
  onToggle: () => void;
}>) {
  return (
    <section className="relative flex flex-col gap-2.5">
      <button
        type="button"
        aria-pressed={isOn(state)}
        aria-label={label}
        disabled={disabled}
        className="absolute inset-0 z-[1] rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        onClick={onToggle}
      />
      <div className={cn("flex min-h-6 items-center gap-2", dimHeader && "opacity-[0.55]")}>
        {header}
        <span className="ml-auto">
          <CheckMark isSelected={isOn(state)} />
        </span>
      </div>
      <div className={cn("rounded-[20px] transition-colors", CARD[state])}>
        {rows.length === 0 ? (
          // One meal row tall, so a day filling or emptying doesn't shift the page.
          <div className="flex h-[76px] items-center justify-center text-muted-foreground/40">
            <Plus size={20} />
          </div>
        ) : (
          rows.map((row, index) => (
            <Fragment key={row.key}>
              {index > 0 && <div className="ml-[76px] border-t" />}
              {row.node}
            </Fragment>
          ))
        )}
      </div>
    </section>
  );
}

/** A planned entry the planner's way (52 px cover, name), read-only; `accessory` sits under the name. */
function EntryRow({
  title,
  coverUrl = null,
  isNote = false,
  dimmed = false,
  struck = false,
  children,
}: Readonly<{
  title: string;
  coverUrl?: string | null;
  isNote?: boolean;
  dimmed?: boolean;
  struck?: boolean;
  children?: ReactNode;
}>) {
  return (
    <div
      className={cn("flex items-center gap-3 p-3", struck ? "opacity-50" : dimmed && "opacity-60")}
    >
      <span className="size-[52px] shrink-0 overflow-hidden rounded-xl">
        {isNote ? (
          <span className="flex size-full items-center justify-center bg-muted text-muted-foreground">
            <StickyNote size={24} />
          </span>
        ) : (
          <RecipeCover url={coverUrl} exists />
        )}
      </span>
      <span className="flex min-w-0 flex-col items-start gap-2">
        <span className={cn("max-w-full truncate font-medium", struck && "line-through")}>
          {title}
        </span>
        {children}
      </span>
    </div>
  );
}

/** "− 2 days +": how many pool copies to hold, one per day the household means to eat it. */
function PoolCounter({
  count,
  onCount,
}: Readonly<{ count: number; onCount: (count: number) => void }>) {
  const { t } = useTranslation();
  return (
    <span className="relative z-10 inline-flex items-center rounded-full bg-muted text-sm font-semibold">
      <button
        type="button"
        className="flex size-8 items-center justify-center disabled:opacity-40"
        aria-label={t("plan.fewerDays")}
        disabled={count <= 1}
        onClick={() => onCount(count - 1)}
      >
        <Minus className="size-4" />
      </button>
      <span className="tabular-nums">{t("dayWithCount", { count })}</span>
      <button
        type="button"
        className="flex size-8 items-center justify-center disabled:opacity-40"
        aria-label={t("plan.moreDays")}
        disabled={count >= MAX_POOL_COUNT}
        onClick={() => onCount(count + 1)}
      >
        <Plus className="size-4" />
      </button>
    </span>
  );
}
