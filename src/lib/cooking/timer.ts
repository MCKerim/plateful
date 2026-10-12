import type { Database } from "@/types/database.types";

export type CookingTimerRow = Database["public"]["Tables"]["cooking_session_timers"]["Row"];

/**
 * One shared kitchen timer of a session. The duration is an absolute `endsAt`
 * (epoch ms), never a countdown: remaining time is `endsAt − now` on any
 * device at any moment, so a force-quit or a late-joining partner costs
 * nothing. `durationSeconds` keeps the configured length for reset.
 */
export type CookingTimer = {
  id: string;
  sessionId: string;
  stepId: string | null;
  label: string;
  endsAt: number | null;
  /** Null for timers created before the column existed; they cannot be reset. */
  durationSeconds: number | null;
  /** Null after the creator's account is erased. */
  createdBy: string | null;
  createdAt: number;
};

function timeOrNull(value: string | null): number | null {
  if (value === null) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

export function parseTimerRow(row: CookingTimerRow): CookingTimer {
  return {
    id: row.id,
    sessionId: row.session_id,
    stepId: row.step_id,
    label: row.label,
    endsAt: timeOrNull(row.ends_at),
    durationSeconds: row.duration_seconds,
    createdBy: row.created_by,
    createdAt: timeOrNull(row.created_at) ?? 0,
  };
}

export function isRunning(timer: CookingTimer): boolean {
  return timer.endsAt !== null;
}

/** Seconds left, clamped at zero. */
export function remainingSeconds(timer: CookingTimer, now = Date.now()): number {
  if (timer.endsAt === null) return 0;
  return Math.max(0, Math.round((timer.endsAt - now) / 1000));
}

/** A timer whose `endsAt` is in the past. */
export function hasFired(timer: CookingTimer, now = Date.now()): boolean {
  return timer.endsAt !== null && timer.endsAt <= now;
}

export type NewTimer = {
  id: string;
  sessionId: string;
  stepId: string | null;
  label: string;
  seconds: number;
  userId: string;
};

/** The timers with a new running one appended; unchanged for a non-positive duration. */
export function startTimer(timers: readonly CookingTimer[], timer: NewTimer, now = Date.now()): CookingTimer[] {
  if (timer.seconds <= 0) return [...timers];
  return [
    ...timers,
    {
      id: timer.id,
      sessionId: timer.sessionId,
      stepId: timer.stepId,
      label: timer.label,
      endsAt: now + timer.seconds * 1000,
      durationSeconds: timer.seconds,
      createdBy: timer.userId,
      createdAt: now,
    },
  ];
}

/** Adds `seconds` (negative subtracts) to a running timer, never below now: subtracting past the end just fires it. */
export function addTime(
  timers: readonly CookingTimer[],
  id: string,
  seconds: number,
  now = Date.now()
): CookingTimer[] {
  return timers.map((timer) =>
    timer.id === id && timer.endsAt !== null
      ? { ...timer, endsAt: Math.max(now, timer.endsAt + seconds * 1000) }
      : timer
  );
}

/** Restarts a timer from its original duration (Reset, and Repeat once fired); no-op without a stored duration. */
export function resetTimer(timers: readonly CookingTimer[], id: string, now = Date.now()): CookingTimer[] {
  return timers.map((timer) =>
    timer.id === id && timer.durationSeconds !== null && timer.durationSeconds > 0
      ? { ...timer, endsAt: now + timer.durationSeconds * 1000 }
      : timer
  );
}

export function stopTimer(timers: readonly CookingTimer[], id: string): CookingTimer[] {
  return timers.filter((timer) => timer.id !== id);
}

/** The timers that ran out after `since` and by `now`: what rings on this device once. */
export function newlyFired(timers: readonly CookingTimer[], since: number, now: number): CookingTimer[] {
  return timers.filter((timer) => timer.endsAt !== null && timer.endsAt > since && timer.endsAt <= now);
}

/** A hand-made timer's name: "45s" under a minute, else "5:00". */
export function durationLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** "4:32", or "1:02:03" past an hour. */
export function countdownText(seconds: number): string {
  const s = Math.max(0, seconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const rest = s % 60;
  const mmss = `${hours > 0 ? String(minutes).padStart(2, "0") : minutes}:${String(rest).padStart(2, "0")}`;
  return hours > 0 ? `${hours}:${mmss}` : mmss;
}

/**
 * The running timer that fires next, for the pill and the bottom bar. A fired
 * timer is never the soonest: its `endsAt` is in the past, and a countdown to
 * it would show nonsense (that crashed iOS once).
 */
export function soonestRunningTimer(timers: readonly CookingTimer[], now = Date.now()): CookingTimer | null {
  let soonest: CookingTimer | null = null;
  for (const timer of timers) {
    if (timer.endsAt === null || timer.endsAt <= now) continue;
    if (soonest === null || soonest.endsAt === null || timer.endsAt < soonest.endsAt) soonest = timer;
  }
  return soonest;
}
