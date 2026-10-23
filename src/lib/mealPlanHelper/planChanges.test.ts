import { describe, expect, it } from "vitest";
import {
  dayState,
  diff,
  isEmptyDiff,
  MAX_POOL_COUNT,
  NO_CHANGES,
  poolCount,
  poolState,
  saveAction,
  setPoolCount,
  toggleDay,
  togglePool,
  type Placement,
} from "@/lib/mealPlanHelper/planChanges";

function row(id: string, day: string | null, eaten = false): Placement {
  return { id, day, eaten };
}

// The native app's `PlanChangesTests`, case for case.
describe("planChanges", () => {
  it("derives day states from the plan and the edits", () => {
    let changes = NO_CHANGES;
    expect(dayState(changes, "2026-09-02", false)).toBe("off");
    expect(dayState(changes, "2026-09-02", true)).toBe("kept");

    changes = toggleDay(changes, "2026-09-02", false);
    expect(dayState(changes, "2026-09-02", false)).toBe("added");
    changes = toggleDay(changes, "2026-09-02", false);
    expect(dayState(changes, "2026-09-02", false)).toBe("off");

    changes = toggleDay(changes, "2026-09-03", true);
    expect(dayState(changes, "2026-09-03", true)).toBe("removed");
    changes = toggleDay(changes, "2026-09-03", true);
    expect(dayState(changes, "2026-09-03", true)).toBe("kept");
  });

  it("reads a day chosen before its row arrived as planned, never as removed", () => {
    const changes = toggleDay(NO_CHANGES, "2026-09-02", false);
    expect(dayState(changes, "2026-09-02", true)).toBe("kept");
    expect(isEmptyDiff(diff(changes, [row("a", "2026-09-02")]))).toBe(true);
  });

  it("toggles the pool and clamps its counter", () => {
    let changes = NO_CHANGES;
    expect(poolState(changes, 0)).toBe("off");
    expect(poolState(changes, 2)).toBe("kept");

    changes = togglePool(changes, 0);
    expect(poolState(changes, 0)).toBe("added");
    expect(poolCount(changes, 0)).toBe(1);
    changes = togglePool(changes, 0);
    expect(poolState(changes, 0)).toBe("off");
    // Toggled on and off before the plan arrived: copies that turn up now are kept, not removed.
    expect(poolState(changes, 2)).toBe("kept");

    changes = togglePool(changes, 2);
    expect(poolState(changes, 2)).toBe("removed");
    changes = togglePool(changes, 2);
    expect(poolState(changes, 2)).toBe("kept");
    expect(poolCount(changes, 2)).toBe(2);

    changes = setPoolCount(changes, 3, 2);
    expect(poolState(changes, 2)).toBe("added");
    changes = setPoolCount(changes, 2, 2);
    expect(poolState(changes, 2)).toBe("kept");
    changes = setPoolCount(changes, 99, 2);
    expect(poolCount(changes, 2)).toBe(MAX_POOL_COUNT);
    changes = setPoolCount(changes, 0, 2);
    expect(poolCount(changes, 2)).toBe(1);
  });

  it("inserts added days and deletes every row of a removed one", () => {
    let changes = toggleDay(NO_CHANGES, "2026-09-02", false);
    changes = toggleDay(changes, "2026-09-04", true);
    const rows = [
      row("keep", "2026-09-03"),
      row("gone", "2026-09-04"),
      row("gone-eaten", "2026-09-04", true),
    ];
    expect(diff(changes, rows)).toEqual({
      insertTargets: ["2026-09-02"],
      deleteIds: ["gone", "gone-eaten"],
    });
  });

  it("deletes nothing for a removed day whose rows are gone", () => {
    const changes = toggleDay(NO_CHANGES, "2026-09-03", true);
    expect(isEmptyDiff(diff(changes, [row("a", "2026-09-04")]))).toBe(true);
  });

  it("inserts nothing for an added day that is planned already", () => {
    const changes = toggleDay(NO_CHANGES, "2026-09-02", false);
    expect(isEmptyDiff(diff(changes, [row("a", "2026-09-02")]))).toBe(true);
  });

  it("adds pool copies and drops the newest surplus", () => {
    let changes = setPoolCount(NO_CHANGES, 3, 1);
    expect(diff(changes, [row("p1", null)])).toEqual({
      insertTargets: [null, null],
      deleteIds: [],
    });

    changes = setPoolCount(NO_CHANGES, 1, 3);
    const rows = [row("p1", null), row("p2", null), row("p3", null), row("p-eaten", null, true)];
    expect(diff(changes, rows)).toEqual({ insertTargets: [], deleteIds: ["p2", "p3"] });

    changes = togglePool(NO_CHANGES, 3);
    expect(diff(changes, rows).deleteIds).toEqual(["p1", "p2", "p3"]);
  });

  it("names the save after what it does", () => {
    expect(saveAction(NO_CHANGES, [])).toEqual({ kind: "none" });

    let changes = toggleDay(NO_CHANGES, "2026-09-02", false);
    changes = toggleDay(changes, "2026-09-03", false);
    expect(saveAction(changes, [])).toEqual({ kind: "planDays", days: 2 });

    changes = setPoolCount(togglePool(NO_CHANGES, 0), 2, 0);
    expect(saveAction(changes, [])).toEqual({ kind: "addToPool" });

    changes = setPoolCount(NO_CHANGES, 2, 1);
    expect(saveAction(changes, [row("p1", null)])).toEqual({ kind: "update" });

    changes = togglePool(toggleDay(NO_CHANGES, "2026-09-02", false), 0);
    expect(saveAction(changes, [])).toEqual({ kind: "update" });

    changes = toggleDay(NO_CHANGES, "2026-09-03", true);
    expect(saveAction(changes, [row("a", "2026-09-03")])).toEqual({ kind: "update" });
  });
});
