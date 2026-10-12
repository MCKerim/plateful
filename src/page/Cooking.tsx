import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { App } from "@capacitor/app";
import { Carrot, ChevronDown, Loader2, X } from "lucide-react";
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
import { rememberOpenedCooking } from "@/lib/cooking/lastOpened";
import { useCookingSession } from "@/hooks/cooking/useCookingSession";
import { useAmbientColor } from "@/hooks/cooking/useAmbientColor";
import { useRecipe } from "@/hooks/recipe/useRecipe";
import { useRecipeFirstImage } from "@/hooks/recipe/useRecipeFirstImage";
import { useScaledIngredients } from "@/hooks/ingredients/useScaledIngredients";
import { useWakeLock } from "@/hooks/general/useWakeLock";
import { useAppSelector } from "@/redux/hooks";
import { selectTargetServings } from "@/redux/slices/servingsSlice";
import { ambientGradient } from "@/lib/cooking/ambientColor";
import { isOnLastStep } from "@/lib/cooking/session";
import { prepareStep, type PreparedStep } from "@/lib/cooking/stepTokens";
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

  const ambient = useAmbientColor(coverUrl);
  const [showIngredients, setShowIngredients] = useState(false);
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

  async function finish() {
    setCelebrating(true);
    await Promise.all([
      cooking.leave("finished"),
      new Promise((resolve) => setTimeout(resolve, CELEBRATION_MS)),
    ]);
    minimize();
  }

  async function cancelCooking() {
    setConfirmingEnd(false);
    await cooking.leave("abandoned");
    minimize();
  }

  const servingsLabel = `${targetServings} ${t(`ingredients.units.${recipe?.servings_unit ?? "servings"}`, {
    defaultValue: recipe?.servings_unit ?? "servings",
  })}`;

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
            renderStep={(step, isCurrent) => (
              <CookingStep
                stepText={step.stepText}
                sectionName={step.sectionName}
                tokens={step.tokens}
                isCurrent={isCurrent}
                ingredientsById={ingredientsById}
                onTimerChip={(seconds, label, state) => {
                  if (state === "idle") cooking.startTimer(seconds, label, step.id);
                }}
                onSelect={() => cooking.setCurrentStepId(step.id)}
              />
            )}
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
