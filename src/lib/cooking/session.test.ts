import { describe, expect, it } from "vitest";
import {
  advancedStepId,
  clampServings,
  cookingState,
  isOnLastStep,
  isStale,
  parseParticipantRow,
  parseSessionRow,
  resumeStepId,
  scaleFactor,
  splitSessions,
  STALE_AFTER_MS,
  toggleIngredient,
  type CookingSessionRow,
} from "@/lib/cooking/session";

const SESSION = "aaaaaaaa-1111-1111-1111-111111111111";
const HOUSEHOLD = "bbbbbbbb-2222-2222-2222-222222222222";
const RECIPE = "cccccccc-3333-3333-3333-333333333333";
const USER = "dddddddd-4444-4444-4444-444444444444";

function sessionRow(overrides: Partial<CookingSessionRow> = {}): CookingSessionRow {
  return {
    id: SESSION,
    household_id: HOUSEHOLD,
    recipe_id: RECIPE,
    started_by: USER,
    target_servings: 4,
    status: "active",
    started_at: "2026-07-10T10:00:00Z",
    ended_at: null,
    ...overrides,
  };
}

const STEPS = [{ id: "s1" }, { id: "s2" }, { id: "s3" }];

describe("session rows", () => {
  it("parses a session row", () => {
    const session = parseSessionRow(sessionRow());
    expect(session.id).toBe(SESSION);
    expect(session.householdId).toBe(HOUSEHOLD);
    expect(session.recipeId).toBe(RECIPE);
    expect(session.targetServings).toBe(4);
    expect(session.status).toBe("active");
    expect(session.startedAt).toBe(Date.parse("2026-07-10T10:00:00Z"));
  });

  it("tolerates null servings and reads an unknown status as abandoned, never as live", () => {
    const session = parseSessionRow(sessionRow({ target_servings: null, status: "paused" }));
    expect(session.targetServings).toBeNull();
    expect(session.status).toBe("abandoned");
  });

  it("parses a participant row with no position yet", () => {
    const participant = parseParticipantRow({ session_id: SESSION, user_id: USER, current_step_id: null });
    expect(participant.currentStepId).toBeNull();
    expect(participant.userId).toBe(USER);
  });

  it("keeps a session whose starter was erased", () => {
    const session = parseSessionRow(sessionRow({ started_by: null, status: "finished" }));
    expect(session.startedBy).toBeNull();
    expect(session.status).toBe("finished");
  });

  it("calls a session stale after a day", () => {
    const session = parseSessionRow(sessionRow());
    expect(isStale(session, session.startedAt + STALE_AFTER_MS - 1)).toBe(false);
    expect(isStale(session, session.startedAt + STALE_AFTER_MS)).toBe(true);
  });
});

describe("steps", () => {
  it("resumes the saved step when it still exists, else the first", () => {
    expect(resumeStepId("s2", STEPS)).toBe("s2");
    expect(resumeStepId("gone", STEPS)).toBe("s1");
    expect(resumeStepId(null, STEPS)).toBe("s1");
    expect(resumeStepId(null, [])).toBeNull();
  });

  it("advances to the next step", () => {
    expect(advancedStepId(STEPS, "s1")).toBe("s2");
  });

  it("stays put on the last step, where Next has become Finish", () => {
    expect(isOnLastStep(STEPS, "s3")).toBe(true);
    expect(advancedStepId(STEPS, "s3")).toBe("s3");
  });
});

describe("ingredients and servings", () => {
  it("toggles an ingredient check round trip", () => {
    const once = toggleIngredient(new Set(), "i1");
    expect(once.has("i1")).toBe(true);
    const twice = toggleIngredient(once, "i1");
    expect(twice.has("i1")).toBe(false);
  });

  it("scales by the servings against the base and clamps servings at one", () => {
    expect(scaleFactor(4, 4)).toBe(1);
    expect(scaleFactor(8, 4)).toBe(2);
    expect(scaleFactor(8, null)).toBe(1);
    expect(clampServings(0)).toBe(1);
    expect(clampServings(3)).toBe(3);
  });
});

describe("cooking state", () => {
  const mine = [{ id: "sess-1", recipeId: RECIPE }];
  const joinable = [{ id: "sess-2", recipeId: RECIPE, cookIds: ["cook-1"] }];

  it("is mine when the user has joined a session", () => {
    expect(cookingState(RECIPE, mine, [])).toEqual({ kind: "mine", sessionId: "sess-1" });
  });

  it("is joinable when only others cook, naming them", () => {
    expect(cookingState(RECIPE, [], joinable)).toEqual({
      kind: "joinable",
      sessionId: "sess-2",
      cookIds: ["cook-1"],
    });
  });

  it("is none when nothing runs for this recipe, even while other recipes cook", () => {
    expect(cookingState("no-session-recipe", mine, joinable)).toEqual({ kind: "none" });
  });

  it("lets mine win over a stray joinable one", () => {
    expect(cookingState(RECIPE, mine, joinable)).toEqual({ kind: "mine", sessionId: "sess-1" });
  });

  it("splits the household's sessions by whether I cook in them", () => {
    const own = { id: "a", cookIds: ["me", "partner"] };
    const theirs = { id: "b", cookIds: ["partner"] };
    expect(splitSessions([own, theirs], "me")).toEqual({ mine: [own], joinable: [theirs] });
  });
});
