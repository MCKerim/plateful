import { describe, expect, it } from "vitest";
import {
  addTime,
  hasFired,
  isRunning,
  parseTimerRow,
  remainingSeconds,
  resetTimer,
  soonestRunningTimer,
  startTimer,
  stopTimer,
  type CookingTimer,
} from "@/lib/cooking/timer";

const NOW = Date.parse("2026-07-10T10:00:00Z");
const SESSION = "aaaaaaaa-1111-1111-1111-111111111111";
const USER = "dddddddd-4444-4444-4444-444444444444";

function start(timers: CookingTimer[], id: string, seconds: number, label: string, stepId: string | null = null) {
  return startTimer(timers, { id, sessionId: SESSION, stepId, label, seconds, userId: USER }, NOW);
}

describe("timer rows", () => {
  it("keeps a timer whose creator was erased", () => {
    const timer = parseTimerRow({
      id: "eeeeeeee-5555-5555-5555-555555555555",
      session_id: SESSION,
      step_id: null,
      label: "10 min",
      ends_at: null,
      duration_seconds: 600,
      paused_remaining_seconds: null,
      created_by: null,
      created_at: "2026-07-10T10:05:00Z",
    });
    expect(timer.createdBy).toBeNull();
    expect(timer.endsAt).toBeNull();
    expect(isRunning(timer)).toBe(false);
    expect(timer.durationSeconds).toBe(600);
  });
});

describe("timer state", () => {
  it("starts a running timer with its time left and duration recorded", () => {
    const timers = start([], "t1", 600, "10 min", "s2");
    expect(timers).toHaveLength(1);
    expect(isRunning(timers[0])).toBe(true);
    expect(timers[0].stepId).toBe("s2");
    expect(timers[0].durationSeconds).toBe(600);
    expect(remainingSeconds(timers[0], NOW)).toBe(600);
  });

  it("ignores a non-positive duration", () => {
    expect(start([], "t1", 0, "nothing")).toHaveLength(0);
  });

  it("adds time, and subtracting past the end clamps to zero and fires", () => {
    let timers = start([], "t1", 300, "5 min");
    timers = addTime(timers, "t1", 60, NOW);
    expect(remainingSeconds(timers[0], NOW)).toBe(360);

    timers = addTime(timers, "t1", -600, NOW);
    expect(remainingSeconds(timers[0], NOW)).toBe(0);
    expect(hasFired(timers[0], NOW)).toBe(true);
  });

  it("resets a fired timer from its original duration", () => {
    let timers = start([], "t1", 120, "2 min");
    timers = addTime(timers, "t1", -600, NOW);
    expect(hasFired(timers[0], NOW)).toBe(true);

    timers = resetTimer(timers, "t1", NOW);
    expect(hasFired(timers[0], NOW)).toBe(false);
    expect(remainingSeconds(timers[0], NOW)).toBe(120);
  });

  it("leaves a legacy timer without a duration alone on reset", () => {
    const legacy: CookingTimer = {
      id: "t0",
      sessionId: SESSION,
      stepId: null,
      label: "old",
      endsAt: NOW - 1000,
      durationSeconds: null,
      createdBy: null,
      createdAt: NOW - 5000,
    };
    expect(resetTimer([legacy], "t0", NOW)[0].endsAt).toBe(NOW - 1000);
  });

  it("stops and removes a timer", () => {
    const timers = start([], "t1", 120, "2 min");
    expect(stopTimer(timers, "t1")).toHaveLength(0);
  });

  it("picks the soonest running timer", () => {
    let timers = start([], "t1", 600, "long");
    timers = start(timers, "t2", 60, "short");
    expect(soonestRunningTimer(timers, NOW)?.label).toBe("short");
  });

  it("never picks a fired timer as soonest", () => {
    let timers = start([], "t1", 60, "fires soon");
    timers = start(timers, "t2", 600, "later");
    timers = addTime(timers, "t1", -600, NOW);
    expect(hasFired(timers[0], NOW)).toBe(true);
    expect(soonestRunningTimer(timers, NOW)?.label).toBe("later");
    expect(soonestRunningTimer(addTime(timers, "t2", -600, NOW), NOW)).toBeNull();
  });
});
