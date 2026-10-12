import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { useSupabase } from "@/utils/supabase";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { selectUser } from "@/redux/slices/userSlice";
import { queryKeys } from "@/lib/query-keys";
import { AnalyticsEvent } from "@/lib/analyticsEvents";
import { cookingApi, type SessionStateRows } from "@/api/cooking.api";
import {
  advancedStepId,
  clampServings,
  parseParticipantRow,
  parseSessionRow,
  resumeStepId,
  type CookingParticipant,
  type CookingSession,
  type CookingSessionStatus,
} from "@/lib/cooking/session";
import {
  addTime,
  parseTimerRow,
  resetTimer,
  startTimer,
  stopTimer,
  type CookingTimer,
} from "@/lib/cooking/timer";
import { useOptimisticMutation } from "@/hooks/general/useOptimisticMutation";
import { useRecipeInstructions } from "@/hooks/instructions/useRecipeInstructions";
import { randomId } from "@/utils/randomId";
import { reportError } from "@/utils/reportError";

/** The shared pot as the cache holds it; the reading position is per cook and lives in the hook. */
export type CookingSessionState = {
  session: CookingSession;
  participants: CookingParticipant[];
  checkedIngredientIds: string[];
  timers: CookingTimer[];
};

function parseSessionState(rows: SessionStateRows): CookingSessionState {
  return {
    session: parseSessionRow(rows.session),
    participants: rows.participants.map(parseParticipantRow),
    checkedIngredientIds: rows.checks.map((check) => check.ingredient_id),
    timers: rows.timers.map(parseTimerRow),
  };
}

/** How long a cook rests on a step before the position is written. */
const STEP_WRITE_DELAY_MS = 1000;

/**
 * One cooking of a recipe, the iOS `CookingStore`: resolves the household's
 * session on open (resume, join or start), loads the shared state and the
 * steps, keeps this cook's position, and writes servings, checks and timers
 * optimistically. `leave` ends the cook's part; the pot ends with its last
 * cook. Realtime keeps the shared state fresh through the handler in App.
 */
export function useCookingSession(recipeId: string | null, preferredServings: number | null) {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();
  const posthog = usePostHog();
  const householdId = useAppSelector(selectHouseholdId);
  const userId = useAppSelector(selectUser)?.id ?? null;

  // The resolved session, remembered with its recipe so a recipe change reads
  // as "not resolved yet" without a reset.
  const [resolved, setResolved] = useState<{ recipeId: string; sessionId: string | null } | null>(null);
  const resolvedFor = useRef<string | null>(null);
  const sessionId = resolved?.recipeId === recipeId ? resolved.sessionId : null;
  const resolveFailed = resolved?.recipeId === recipeId && resolved.sessionId === null;

  useEffect(() => {
    if (!recipeId || !householdId || !userId || resolvedFor.current === recipeId) return;
    resolvedFor.current = recipeId;
    cookingApi
      .resolveSession(supabase, { recipeId, householdId, userId, targetServings: preferredServings })
      .then(({ session, created }) => {
        setResolved({ recipeId, sessionId: session.id });
        if (created) posthog?.capture(AnalyticsEvent.cookingStarted);
        void queryClient.invalidateQueries({ queryKey: queryKeys.cooking.household(householdId) });
      })
      .catch((error) => {
        reportError("Cooking session resolve failed", error);
        setResolved({ recipeId, sessionId: null });
      });
  }, [recipeId, householdId, userId, preferredServings, supabase, posthog, queryClient]);

  const queryKey = queryKeys.cooking.session(sessionId ?? "");
  const stateQuery = useQuery({
    queryKey,
    queryFn: async () => parseSessionState(await cookingApi.getSessionState(supabase, sessionId ?? "")),
    enabled: !!sessionId,
  });
  const stepsQuery = useRecipeInstructions(recipeId);
  const state = stateQuery.data;
  const steps = useMemo(() => stepsQuery.data ?? [], [stepsQuery.data]);

  // This cook's position: the saved row (or the first step) until the cook
  // moves, then owned here; written back after a pause either way.
  const [movedStepId, setCurrentStepId] = useState<string | null | undefined>(undefined);
  const savedStepId = state?.participants.find((p) => p.userId === userId)?.currentStepId ?? null;
  const currentStepId =
    movedStepId !== undefined
      ? movedStepId
      : state && stepsQuery.isSuccess
        ? resumeStepId(savedStepId, steps)
        : null;

  useEffect(() => {
    if (!sessionId || !userId || !currentStepId) return;
    const timeout = setTimeout(() => {
      cookingApi
        .updateCurrentStep(supabase, sessionId, userId, currentStepId)
        .catch((error) => reportError("Cooking step write failed", error));
    }, STEP_WRITE_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [currentStepId, sessionId, userId, supabase]);

  const advance = useCallback(() => {
    setCurrentStepId(advancedStepId(steps, currentStepId));
  }, [currentStepId, steps]);

  const mutationOptions = { mutationKey: queryKeys.cooking.all, queryKey: () => queryKey };

  const servingsMutation = useOptimisticMutation<CookingSessionState, { count: number }, void>({
    ...mutationOptions,
    mutationFn: ({ count }) => cookingApi.updateServings(supabase, sessionId ?? "", count),
    optimistic: (data, { count }) =>
      data && { ...data, session: { ...data.session, targetServings: count } },
  });

  const checkMutation = useOptimisticMutation<
    CookingSessionState,
    { ingredientId: string; checked: boolean },
    void
  >({
    ...mutationOptions,
    mutationFn: ({ ingredientId, checked }) =>
      checked
        ? cookingApi.check(supabase, sessionId ?? "", ingredientId, userId ?? "")
        : cookingApi.uncheck(supabase, sessionId ?? "", ingredientId),
    optimistic: (data, { ingredientId, checked }) =>
      data && {
        ...data,
        checkedIngredientIds: checked
          ? [...new Set([...data.checkedIngredientIds, ingredientId])]
          : data.checkedIngredientIds.filter((id) => id !== ingredientId),
      },
  });

  const startTimerMutation = useOptimisticMutation<CookingSessionState, CookingTimer, void>({
    ...mutationOptions,
    mutationFn: (timer) =>
      cookingApi.startTimer(supabase, {
        id: timer.id,
        sessionId: timer.sessionId,
        stepId: timer.stepId,
        label: timer.label,
        endsAt: timer.endsAt ?? Date.now(),
        durationSeconds: timer.durationSeconds ?? 0,
        userId: userId ?? "",
      }),
    optimistic: (data, timer) => data && { ...data, timers: [...data.timers, timer] },
  });

  const rescheduleMutation = useOptimisticMutation<
    CookingSessionState,
    { id: string; endsAt: number },
    void
  >({
    ...mutationOptions,
    mutationFn: ({ id, endsAt }) => cookingApi.rescheduleTimer(supabase, id, endsAt),
    optimistic: (data, { id, endsAt }) =>
      data && {
        ...data,
        timers: data.timers.map((timer) => (timer.id === id ? { ...timer, endsAt } : timer)),
      },
  });

  const stopTimerMutation = useOptimisticMutation<CookingSessionState, { id: string }, void>({
    ...mutationOptions,
    mutationFn: ({ id }) => cookingApi.removeTimer(supabase, id),
    optimistic: (data, { id }) => data && { ...data, timers: stopTimer(data.timers, id) },
  });

  const setServings = useCallback(
    (count: number) => {
      const clamped = clampServings(count);
      if (!state || clamped === state.session.targetServings) return;
      servingsMutation.mutate({ count: clamped });
    },
    [servingsMutation, state]
  );

  const toggleIngredient = useCallback(
    (ingredientId: string) => {
      if (!state) return;
      checkMutation.mutate({ ingredientId, checked: !state.checkedIngredientIds.includes(ingredientId) });
    },
    [checkMutation, state]
  );

  const startTimerFor = useCallback(
    (seconds: number, label: string, stepId: string | null) => {
      if (!state || !sessionId || !userId) return;
      const added = startTimer(state.timers, { id: randomId(), sessionId, stepId, label, seconds, userId });
      const timer = added[added.length - 1];
      if (added.length === state.timers.length || !timer) return;
      posthog?.capture(AnalyticsEvent.cookingTimerStarted);
      startTimerMutation.mutate(timer);
    },
    [posthog, sessionId, startTimerMutation, state, userId]
  );

  /** A new `endsAt` computed by the pure timer rules, written once. */
  const reschedule = useCallback(
    (id: string, next: CookingTimer[]) => {
      const endsAt = next.find((timer) => timer.id === id)?.endsAt;
      if (endsAt === undefined || endsAt === null) return;
      if (endsAt === state?.timers.find((timer) => timer.id === id)?.endsAt) return;
      rescheduleMutation.mutate({ id, endsAt });
    },
    [rescheduleMutation, state]
  );

  const addTimeTo = useCallback(
    (id: string, seconds: number) => state && reschedule(id, addTime(state.timers, id, seconds)),
    [reschedule, state]
  );

  const resetTimerById = useCallback(
    (id: string) => state && reschedule(id, resetTimer(state.timers, id)),
    [reschedule, state]
  );

  const stopTimerById = useCallback(
    (id: string) => stopTimerMutation.mutate({ id }),
    [stopTimerMutation]
  );

  /**
   * This cook leaves; the pot ends with the status only when nobody remains
   * (the count errs toward keeping it). Resolves once the screen may close.
   */
  const leave = useCallback(
    async (status: Extract<CookingSessionStatus, "finished" | "abandoned">) => {
      if (!sessionId || !userId) return;
      try {
        await cookingApi.leave(supabase, sessionId, userId);
        const remaining = await cookingApi
          .getParticipants(supabase, sessionId)
          .then((rows) => rows.length)
          .catch(() => 1);
        if (remaining === 0) {
          await cookingApi.removeTimers(supabase, sessionId);
          await cookingApi.endSession(supabase, sessionId, status);
        }
      } catch (error) {
        reportError("Cooking session leave failed", error);
      }
      posthog?.capture(
        status === "finished" ? AnalyticsEvent.cookingFinished : AnalyticsEvent.cookingAbandoned
      );
      queryClient.removeQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: queryKeys.cooking.household(householdId ?? "") });
    },
    [householdId, posthog, queryClient, queryKey, sessionId, supabase, userId]
  );

  const status = resolveFailed || stateQuery.isError || stepsQuery.isError
    ? "failed"
    : state && stepsQuery.isSuccess
      ? "ready"
      : "loading";

  return {
    status,
    sessionId,
    session: state?.session ?? null,
    steps,
    currentStepId,
    setCurrentStepId,
    advance,
    targetServings: state?.session.targetServings ?? null,
    setServings,
    checkedIngredientIds: useMemo(
      () => new Set(state?.checkedIngredientIds ?? []),
      [state?.checkedIngredientIds]
    ),
    toggleIngredient,
    timers: state?.timers ?? [],
    startTimer: startTimerFor,
    addTime: addTimeTo,
    resetTimer: resetTimerById,
    stopTimer: stopTimerById,
    leave,
  };
}
