import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { App } from "@capacitor/app";
import { Carrot, ChevronDown, Loader2, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CookingStep from "@/components/cooking/CookingStep";
import CookingStepFeed from "@/components/cooking/CookingStepFeed";
import CookingIngredientsSheet from "@/components/cooking/CookingIngredientsSheet";
import CookingTimersSheet from "@/components/cooking/CookingTimersSheet";
import { rememberOpenedCooking } from "@/lib/cooking/lastOpened";
import { useCookingSession } from "@/hooks/cooking/useCookingSession";
import { useAmbientColor } from "@/hooks/cooking/useAmbientColor";
import { useClock } from "@/hooks/cooking/useClock";
import { useTimerRing } from "@/hooks/cooking/useTimerRing";
import { useRecipe } from "@/hooks/recipe/useRecipe";
import { useRecipeFirstImage } from "@/hooks/recipe/useRecipeFirstImage";
import { useScaledIngredients } from "@/hooks/ingredients/useScaledIngredients";
import { useWakeLock } from "@/hooks/general/useWakeLock";
import { useAppSelector } from "@/redux/hooks";
import { selectTargetServings } from "@/redux/slices/servingsSlice";
import { ambientGradient } from "@/lib/cooking/ambientColor";
import { isOnLastStep } from "@/lib/cooking/session";
import { prepareStep, type PreparedStep } from "@/lib/cooking/stepTokens";
import { countdownText, hasFired, remainingSeconds, soonestRunningTimer } from "@/lib/cooking/timer";
import { cancelTimerAlarms, ensureTimerAlarmPermission, reconcileTimerAlarms } from "@/lib/cooking/timerAlarms";
import { cn } from "@/lib/utils";

type FeedStep = PreparedStep & { id: string; stepText: string; sectionName: string | null };

/** How long the finish moment stays before the screen closes. */
const CELEBRATION_MS = 1400;

/**
 * Cooking mode: one recipe as a fullscreen session. The step feed is the
 * navigation, the shared pot (servings, checks, timers) lives in the session
 * hook, and leaving the screen never ends the cooking; only Finish or the
 * close button does, for this cook.
 */
export default function Cooking() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { recipeId = null } = useParams();
  const { data: recipe } = useRecipe(recipeId);
  const { data: coverUrl } = useRecipeFirstImage(recipeId);
  const savedServings = useAppSelector((state) =>
    recipeId ? selectTargetServings(recipeId)(state) : undefined
  );
  // The detail's scaling seeds a new session's servings, so wait for the recipe.
  const cooking = useCookingSession(recipe ? recipeId : null, savedServings ?? recipe?.base_servings ?? null);
  useWakeLock();

  const baseServings = recipe?.base_servings ?? 1;
  const targetServings = cooking.targetServings ?? baseServings;
  const { data: scaledIngredients } = useScaledIngredients(recipe ? recipeId : null, baseServings, targetServings);
  const ingredientsById = useMemo(
    () => new Map(scaledIngredients.map((ingredient) => [ingredient.id, ingredient])),
    [scaledIngredients]
  );
  const feedSteps = useMemo<FeedStep[]>(() => {
    const ids = new Set(ingredientsById.keys());
    return cooking.steps.map((step, index) => ({
      id: step.id,
      stepText: step.stepText,
      sectionName:
        step.groupName && cooking.steps[index - 1]?.groupName !== step.groupName ? step.groupName : null,
      ...prepareStep(step.stepText, step.annotation, ids),
    }));
  }, [cooking.steps, ingredientsById]);

  // Timers: the clock ticks while any timer exists, so countdowns move and a
  // fired chip re-renders; every device of a joined cook keeps its own alarms.
  const timers = cooking.timers;
  const now = useClock(timers.some((timer) => timer.endsAt !== null));
  const soonest = soonestRunningTimer(timers, now);
  const recipeName = recipe?.name ?? "";
  const stopTimer = useCallback(
    (id: string) => {
      void cancelTimerAlarms([id]);
      cooking.stopTimer(id);
    },
    [cooking]
  );
  useTimerRing(timers, now, recipeName, stopTimer);
  useEffect(() => {
    if (!recipeId || !recipe) return;
    void reconcileTimerAlarms(timers, { recipeId, recipeName: recipe.name, title: t("cooking.timerUp") });
  }, [timers, recipeId, recipe, t]);
  const startTimer = useCallback(
    (seconds: number, label: string, stepId: string | null) => {
      void ensureTimerAlarmPermission();
      cooking.startTimer(seconds, label, stepId);
    },
    [cooking]
  );

  const ambient = useAmbientColor(coverUrl);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showTimers, setShowTimers] = useState(false);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    if (recipeId) rememberOpenedCooking(recipeId);
  }, [recipeId]);

  const minimize = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/home");
  }, [navigate]);

  useEffect(() => {
    const listener = App.addListener("backButton", minimize);
    return () => {
      listener.then((handle) => handle.remove());
    };
  }, [minimize]);

  const onLastStep = isOnLastStep(cooking.steps, cooking.currentStepId);

  async function leave(status: "finished" | "abandoned") {
    void cancelTimerAlarms(timers.map((timer) => timer.id));
    await cooking.leave(status);
  }

  async function finish() {
    setCelebrating(true);
    await Promise.all([leave("finished"), new Promise((resolve) => setTimeout(resolve, CELEBRATION_MS))]);
    minimize();
  }

  async function cancelCooking() {
    setConfirmingEnd(false);
    await leave("abandoned");
    minimize();
  }

  const servingsLabel = `${targetServings} ${t(`ingredients.units.${recipe?.servings_unit ?? "servings"}`, {
    defaultValue: recipe?.servings_unit ?? "servings",
  })}`;
  const stepNumber = (stepId: string | null) => {
    const index = stepId ? cooking.steps.findIndex((step) => step.id === stepId) : -1;
    return index === -1 ? null : index + 1;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      style={{ background: ambientGradient(ambient) }}
    >
      <header className="flex h-14 shrink-0 items-center px-1 pt-[env(safe-area-inset-top)]">
        <Button variant="ghost" size="icon" onClick={minimize} aria-label={t("cooking.minimize")}>
          <ChevronDown className="!size-6" />
        </Button>
        <button
          type="button"
          onClick={() => recipeId && navigate(`/recipe/${recipeId}`)}
          className="min-w-0 flex-1 text-center"
        >
          <span className="block truncate font-semibold">{recipe?.name ?? ""}</span>
          {cooking.status === "ready" && (
            <span className="block text-xs text-muted-foreground">{servingsLabel}</span>
          )}
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setConfirmingEnd(true)}
          disabled={cooking.status !== "ready"}
          aria-label={t("cooking.endCooking")}
        >
          <X className="!size-6" />
        </Button>
      </header>

      <main className="relative min-h-0 flex-1">
        {cooking.status === "loading" && (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {cooking.status === "failed" && (
          <Notice title={t("cooking.couldNotStart")} body={t("cooking.checkConnection")}>
            <Button variant="secondary" onClick={cooking.retry}>
              {t("common.retry")}
            </Button>
          </Notice>
        )}
        {cooking.status === "ready" && feedSteps.length === 0 && (
          <Notice title={t("cooking.noSteps")} body="">
            <Button variant="secondary" onClick={minimize}>
              {t("common.close")}
            </Button>
          </Notice>
        )}
        {cooking.status === "ready" && feedSteps.length > 0 && (
          <CookingStepFeed
            steps={feedSteps}
            currentStepId={cooking.currentStepId}
            onCurrentStepChange={cooking.setCurrentStepId}
            header={
              coverUrl ? (
                <div className="flex h-[40vh] items-center justify-center">
                  <img
                    src={coverUrl}
                    alt=""
                    className={cn(
                      "max-h-full max-w-full rounded-2xl object-contain shadow-lg transition-opacity duration-300",
                      cooking.currentStepId === feedSteps[0].id ? "opacity-100" : "opacity-30"
                    )}
                  />
                </div>
              ) : undefined
            }
            renderStep={(step, isCurrent) => {
              // Chip and timer meet on the label the timer was started with.
              const timerFor = (label: string) =>
                timers.find((timer) => timer.stepId === step.id && timer.label === label);
              return (
                <CookingStep
                  stepText={step.stepText}
                  sectionName={step.sectionName}
                  tokens={step.tokens}
                  isCurrent={isCurrent}
                  ingredientsById={ingredientsById}
                  chipState={(label) => {
                    const timer = timerFor(label);
                    return !timer ? "idle" : hasFired(timer, now) ? "finished" : "running";
                  }}
                  chipCountdown={(label) => {
                    const timer = timerFor(label);
                    return timer ? countdownText(remainingSeconds(timer, now)) : null;
                  }}
                  onTimerChip={(seconds, label, state) => {
                    if (state === "idle") startTimer(seconds, label, step.id);
                    else setShowTimers(true);
                  }}
                  onSelect={() => cooking.setCurrentStepId(step.id)}
                />
              );
            }}
          />
        )}
      </main>

      <footer className="flex shrink-0 items-center gap-2 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full"
          onClick={() => setShowIngredients(true)}
          disabled={cooking.status !== "ready"}
          aria-label={t("cooking.ingredients")}
        >
          <Carrot className="!size-5" />
        </Button>
        <Button
          variant="secondary"
          className={cn("rounded-full", soonest ? "px-3" : "w-10 px-0")}
          onClick={() => setShowTimers(true)}
          disabled={cooking.status !== "ready"}
          aria-label={t("cooking.timers")}
        >
          <Timer className="!size-5" />
          {soonest && <span className="tabular-nums">{countdownText(remainingSeconds(soonest, now))}</span>}
        </Button>
        <div className="flex-1" />
        <Button
          variant="accent"
          className="rounded-full px-6 font-semibold"
          onClick={onLastStep ? finish : cooking.advance}
          disabled={cooking.status !== "ready" || feedSteps.length === 0 || celebrating}
        >
          {onLastStep ? t("cooking.finish") : t("cooking.next")}
        </Button>
      </footer>

      <CookingIngredientsSheet
        open={showIngredients}
        onOpenChange={setShowIngredients}
        ingredients={scaledIngredients}
        isScaled={targetServings !== baseServings}
        servings={targetServings}
        servingsUnit={recipe?.servings_unit ?? "servings"}
        onServingsChange={cooking.setServings}
        checked={cooking.checkedIngredientIds}
        onToggle={cooking.toggleIngredient}
      />

      <CookingTimersSheet
        open={showTimers}
        onOpenChange={setShowTimers}
        timers={timers}
        now={now}
        stepNumber={stepNumber}
        onAddTime={cooking.addTime}
        onReset={cooking.resetTimer}
        onStop={stopTimer}
        onStart={(seconds, label) => startTimer(seconds, label, null)}
      />

      <Dialog open={confirmingEnd} onOpenChange={setConfirmingEnd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cooking.endCooking")}</DialogTitle>
            <DialogDescription>{t("cooking.endMessage")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              onClick={() => {
                setConfirmingEnd(false);
                void finish();
              }}
            >
              {t("cooking.finishCooking")}
            </Button>
            <Button variant="destructive" onClick={cancelCooking}>
              {t("cooking.cancelCooking")}
            </Button>
            <Button variant="secondary" onClick={() => setConfirmingEnd(false)}>
              {t("cooking.keepCooking")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {celebrating && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-accent text-accent-foreground">
          <p className="first-font text-4xl">{t("cooking.enjoy")}</p>
          <p className="font-semibold">{recipe?.name}</p>
        </div>
      )}
    </div>
  );
}

function Notice({ title, body, children }: Readonly<{ title: string; body: string; children: React.ReactNode }>) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {body && <p className="text-sm text-muted-foreground">{body}</p>}
      {children}
    </div>
  );
}
