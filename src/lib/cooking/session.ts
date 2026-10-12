import type { Database } from "@/types/database.types";

export type CookingSessionRow = Database["public"]["Tables"]["cooking_sessions"]["Row"];
export type CookingParticipantRow = Pick<
  Database["public"]["Tables"]["cooking_session_participants"]["Row"],
  "session_id" | "user_id" | "current_step_id"
>;

export type CookingSessionStatus = "active" | "finished" | "abandoned";

/**
 * A household's cooking of a recipe. The dish state (servings, status) is
 * shared by every participant; each cook's own reading position lives on
 * their participant row.
 */
export type CookingSession = {
  id: string;
  householdId: string;
  recipeId: string;
  /** Null after the starter's account is erased. */
  startedBy: string | null;
  targetServings: number | null;
  status: CookingSessionStatus;
  /** Epoch ms. */
  startedAt: number;
  endedAt: number | null;
};

/** One cook's own state in a session: only the reading position. */
export type CookingParticipant = {
  sessionId: string;
  userId: string;
  currentStepId: string | null;
};

function timeOrNull(value: string | null): number | null {
  if (value === null) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

/** A status this client doesn't know reads as abandoned, never as live. */
function parseStatus(raw: string): CookingSessionStatus {
  return raw === "active" || raw === "finished" ? raw : "abandoned";
}

export function parseSessionRow(row: CookingSessionRow): CookingSession {
  return {
    id: row.id,
    householdId: row.household_id,
    recipeId: row.recipe_id,
    startedBy: row.started_by,
    targetServings: row.target_servings,
    status: parseStatus(row.status),
    startedAt: timeOrNull(row.started_at) ?? 0,
    endedAt: timeOrNull(row.ended_at),
  };
}

export function parseParticipantRow(row: CookingParticipantRow): CookingParticipant {
  return { sessionId: row.session_id, userId: row.user_id, currentStepId: row.current_step_id };
}

/** A session untouched for a day is yesterday's dinner, not tonight's. */
export const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export function isStale(session: CookingSession, now = Date.now()): boolean {
  return now - session.startedAt >= STALE_AFTER_MS;
}

/** The step to land on: the saved position when it still exists, otherwise the first step. */
export function resumeStepId(saved: string | null, steps: readonly { id: string }[]): string | null {
  if (saved !== null && steps.some((step) => step.id === saved)) return saved;
  return steps[0]?.id ?? null;
}

export function isOnLastStep(steps: readonly { id: string }[], currentStepId: string | null): boolean {
  return steps.length > 0 && steps[steps.length - 1].id === currentStepId;
}

/** The next step's id; on the last step (where Next has become Finish) or an unknown step, the current one. */
export function advancedStepId(steps: readonly { id: string }[], currentStepId: string | null): string | null {
  const index = steps.findIndex((step) => step.id === currentStepId);
  if (index === -1 || index + 1 >= steps.length) return currentStepId;
  return steps[index + 1].id;
}

/** Servings can never drop below one. */
export function clampServings(count: number): number {
  return Math.max(1, Math.round(count));
}

/** The session's servings against the recipe's base; a recipe without a base scales by one. */
export function scaleFactor(targetServings: number, baseServings: number | null): number {
  return baseServings !== null && baseServings > 0 ? targetServings / baseServings : 1;
}

export function toggleIngredient(checked: ReadonlySet<string>, ingredientId: string): Set<string> {
  const next = new Set(checked);
  if (!next.delete(ingredientId)) next.add(ingredientId);
  return next;
}

/** The household's sessions split into the ones I am in and the ones I could join. */
export function splitSessions<T extends { cookIds: string[] }>(
  sessions: readonly T[],
  userId: string
): { mine: T[]; joinable: T[] } {
  const mine: T[] = [];
  const joinable: T[] = [];
  for (const session of sessions) (session.cookIds.includes(userId) ? mine : joinable).push(session);
  return { mine, joinable };
}

/** What the recipe's cook button reads: "Cook", "Continue" (mine) or "Join" (a member's I haven't joined). */
export type RecipeCookingState =
  | { kind: "none" }
  | { kind: "mine"; sessionId: string }
  | { kind: "joinable"; sessionId: string; cookIds: string[] };

/** The user's own session wins over a stray joinable one for the same recipe. */
export function cookingState(
  recipeId: string,
  mine: readonly { id: string; recipeId: string }[],
  joinable: readonly { id: string; recipeId: string; cookIds: string[] }[]
): RecipeCookingState {
  const own = mine.find((session) => session.recipeId === recipeId);
  if (own) return { kind: "mine", sessionId: own.id };
  const other = joinable.find((session) => session.recipeId === recipeId);
  if (other) return { kind: "joinable", sessionId: other.id, cookIds: other.cookIds };
  return { kind: "none" };
}
