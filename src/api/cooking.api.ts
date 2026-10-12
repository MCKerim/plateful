import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { STALE_AFTER_MS, type CookingSessionRow, type CookingSessionStatus } from "@/lib/cooking/session";
import type { CookingTimerRow } from "@/lib/cooking/timer";
import { reportError } from "@/utils/reportError";

type Client = SupabaseClient<Database>;

const SESSION_COLUMNS =
  "id, household_id, recipe_id, started_by, target_servings, status, started_at, ended_at";
const TIMER_COLUMNS =
  "id, session_id, step_id, label, ends_at, duration_seconds, paused_remaining_seconds, created_by, created_at";
const RECIPE_COLUMNS = "id, name, image_path, base_servings, servings_unit";

/** A session with its recipe and participants embedded: one round trip for pill, button and invite card. */
export type HouseholdSessionRow = CookingSessionRow & {
  recipes: {
    id: string;
    name: string;
    image_path: string | null;
    base_servings: number | null;
    servings_unit: string | null;
  } | null;
  cooking_session_participants: { user_id: string }[];
};

export type ParticipantRow = Pick<
  Database["public"]["Tables"]["cooking_session_participants"]["Row"],
  "session_id" | "user_id" | "current_step_id"
>;

export type SessionStateRows = {
  session: CookingSessionRow;
  participants: ParticipantRow[];
  checks: { ingredient_id: string }[];
  timers: CookingTimerRow[];
};

// Every read and write is household-scoped by RLS; the tables are the iOS app's.
export const cookingApi = {
  /** The household's active sessions started after `since`, newest first, with recipe and cooks. */
  async getHouseholdSessions(
    supabase: Client,
    householdId: string,
    since: string
  ): Promise<HouseholdSessionRow[]> {
    const { data, error } = await supabase
      .from("cooking_sessions")
      .select(`${SESSION_COLUMNS}, recipes(${RECIPE_COLUMNS}), cooking_session_participants(user_id)`)
      .eq("household_id", householdId)
      .eq("status", "active")
      .gte("started_at", since)
      .order("started_at", { ascending: false })
      .overrideTypes<HouseholdSessionRow[], { merge: false }>();
    if (error) throw error;
    return data ?? [];
  },

  /** The household's newest active session for a recipe, or null. */
  async getActiveSession(
    supabase: Client,
    recipeId: string,
    householdId: string
  ): Promise<CookingSessionRow | null> {
    const { data, error } = await supabase
      .from("cooking_sessions")
      .select(SESSION_COLUMNS)
      .eq("recipe_id", recipeId)
      .eq("household_id", householdId)
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async createSession(
    supabase: Client,
    params: { householdId: string; recipeId: string; userId: string; targetServings: number | null }
  ): Promise<CookingSessionRow> {
    const { data, error } = await supabase
      .from("cooking_sessions")
      .insert({
        household_id: params.householdId,
        recipe_id: params.recipeId,
        started_by: params.userId,
        target_servings: params.targetServings,
      })
      .select(SESSION_COLUMNS)
      .single();
    if (error) throw error;
    return data;
  },

  /** Ends a session and stamps `ended_at`. */
  async endSession(supabase: Client, sessionId: string, status: CookingSessionStatus): Promise<void> {
    const { error } = await supabase
      .from("cooking_sessions")
      .update({ status, ended_at: new Date().toISOString() })
      .eq("id", sessionId);
    if (error) throw error;
  },

  async updateServings(supabase: Client, sessionId: string, targetServings: number): Promise<void> {
    const { error } = await supabase
      .from("cooking_sessions")
      .update({ target_servings: targetServings })
      .eq("id", sessionId);
    if (error) throw error;
  },

  /** The session row with its participants, checks and timers. */
  async getSessionState(supabase: Client, sessionId: string): Promise<SessionStateRows> {
    const [session, participants, checks, timers] = await Promise.all([
      supabase.from("cooking_sessions").select(SESSION_COLUMNS).eq("id", sessionId).single(),
      supabase
        .from("cooking_session_participants")
        .select("session_id, user_id, current_step_id")
        .eq("session_id", sessionId),
      supabase.from("cooking_session_checks").select("ingredient_id").eq("session_id", sessionId),
      supabase
        .from("cooking_session_timers")
        .select(TIMER_COLUMNS)
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true }),
    ]);
    const failure = session.error ?? participants.error ?? checks.error ?? timers.error;
    if (failure) throw failure;
    if (!session.data) throw new Error("Cooking session not found");
    return {
      session: session.data,
      participants: participants.data ?? [],
      checks: checks.data ?? [],
      timers: timers.data ?? [],
    };
  },

  async getParticipants(supabase: Client, sessionId: string): Promise<ParticipantRow[]> {
    const { data, error } = await supabase
      .from("cooking_session_participants")
      .select("session_id, user_id, current_step_id")
      .eq("session_id", sessionId);
    if (error) throw error;
    return data ?? [];
  },

  /** Joining twice is a no-op, not an error. */
  async join(supabase: Client, sessionId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("cooking_session_participants")
      .upsert(
        { session_id: sessionId, user_id: userId },
        { onConflict: "session_id,user_id", ignoreDuplicates: true }
      );
    if (error) throw error;
  },

  /** Stop and Finish are a personal leave, not the end of the shared pot. */
  async leave(supabase: Client, sessionId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("cooking_session_participants")
      .delete()
      .eq("session_id", sessionId)
      .eq("user_id", userId);
    if (error) throw error;
  },

  async updateCurrentStep(
    supabase: Client,
    sessionId: string,
    userId: string,
    stepId: string | null
  ): Promise<void> {
    const { error } = await supabase
      .from("cooking_session_participants")
      .update({ current_step_id: stepId })
      .eq("session_id", sessionId)
      .eq("user_id", userId);
    if (error) throw error;
  },

  /** Checking twice (two cooks at once) is a no-op. */
  async check(supabase: Client, sessionId: string, ingredientId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("cooking_session_checks")
      .upsert(
        { session_id: sessionId, ingredient_id: ingredientId, checked_by: userId },
        { onConflict: "session_id,ingredient_id", ignoreDuplicates: true }
      );
    if (error) throw error;
  },

  async uncheck(supabase: Client, sessionId: string, ingredientId: string): Promise<void> {
    const { error } = await supabase
      .from("cooking_session_checks")
      .delete()
      .eq("session_id", sessionId)
      .eq("ingredient_id", ingredientId);
    if (error) throw error;
  },

  /** Every timer of several sessions, for the pill's countdown across them. */
  async getTimersForSessions(supabase: Client, sessionIds: string[]): Promise<CookingTimerRow[]> {
    if (sessionIds.length === 0) return [];
    const { data, error } = await supabase
      .from("cooking_session_timers")
      .select(TIMER_COLUMNS)
      .in("session_id", sessionIds);
    if (error) throw error;
    return data ?? [];
  },

  /** The id is client-minted, so the screen and the alarm run before the write and the realtime echo dedupes. */
  async startTimer(
    supabase: Client,
    timer: {
      id: string;
      sessionId: string;
      stepId: string | null;
      label: string;
      endsAt: number;
      durationSeconds: number;
      userId: string;
    }
  ): Promise<void> {
    const { error } = await supabase.from("cooking_session_timers").insert({
      id: timer.id,
      session_id: timer.sessionId,
      step_id: timer.stepId,
      label: timer.label,
      ends_at: new Date(timer.endsAt).toISOString(),
      duration_seconds: timer.durationSeconds,
      created_by: timer.userId,
    });
    if (error) throw error;
  },

  /** Moves a timer's fire time: add or subtract time, reset, repeat. */
  async rescheduleTimer(supabase: Client, id: string, endsAt: number): Promise<void> {
    const { error } = await supabase
      .from("cooking_session_timers")
      .update({ ends_at: new Date(endsAt).toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async removeTimer(supabase: Client, id: string): Promise<void> {
    const { error } = await supabase.from("cooking_session_timers").delete().eq("id", id);
    if (error) throw error;
  },

  /** Timers belong to the session; ending it removes their rows instead of leaving orphans. */
  async removeTimers(supabase: Client, sessionId: string): Promise<void> {
    const { error } = await supabase.from("cooking_session_timers").delete().eq("session_id", sessionId);
    if (error) throw error;
  },

  /**
   * The session to cook in: the household's active one for the recipe when
   * it started less than a day ago (joined), else that stale one abandoned
   * and a fresh one created and joined. `created` says whether this call
   * started the cooking, for analytics.
   */
  async resolveSession(
    supabase: Client,
    params: {
      recipeId: string;
      householdId: string;
      userId: string;
      targetServings: number | null;
      now?: number;
    }
  ): Promise<{ session: CookingSessionRow; created: boolean }> {
    const now = params.now ?? Date.now();
    const existing = await cookingApi.getActiveSession(supabase, params.recipeId, params.householdId);
    if (existing) {
      if (now - Date.parse(existing.started_at) < STALE_AFTER_MS) {
        await cookingApi.join(supabase, existing.id, params.userId);
        return { session: existing, created: false };
      }
      // Yesterday's dinner: clear it out of the way, but never let that block cooking tonight.
      try {
        await cookingApi.removeTimers(supabase, existing.id);
        await cookingApi.endSession(supabase, existing.id, "abandoned");
      } catch (error) {
        reportError("Stale cooking session cleanup failed", error);
      }
    }
    const session = await cookingApi.createSession(supabase, {
      householdId: params.householdId,
      recipeId: params.recipeId,
      userId: params.userId,
      targetServings: params.targetServings,
    });
    await cookingApi.join(supabase, session.id, params.userId);
    return { session, created: true };
  },
};
