/** A local calendar day as the server's `planned_date` holds it ("2026-10-23", `toPlannedDateString`). */
export type DayKey = string;

/**
 * The Plan sheet's edits on top of the current plan, for one recipe or note:
 * the days it gained or lost, and how many pool copies it should have. Kept
 * as edits, never as a selection copied at open: the plan underneath can
 * change (the load after open, a partner's change, a half-failed save), and
 * every state is derived from the plan as it stands, so an entry that
 * arrives later reads as planned rather than as "will be removed". The
 * native app's `PlanChanges`, ported with its tests.
 */
export type PlanChanges = {
  /** Days chosen that the subject wasn't on. */
  readonly addedDays: ReadonlySet<DayKey>;
  /** Days the subject was on and was deselected. */
  readonly removedDays: ReadonlySet<DayKey>;
  /** The wanted number of uneaten pool copies; `null` while untouched. */
  readonly poolCount: number | null;
};

/** The most copies the pool counter offers: a week's worth. */
export const MAX_POOL_COUNT = 7;

export const NO_CHANGES: PlanChanges = {
  addedDays: new Set(),
  removedDays: new Set(),
  poolCount: null,
};

/**
 * A section's standing, a day's or the pool's, from the plan and the edits
 * together: `added` inserts on save (for the pool also a changed copy
 * count), `removed` deletes.
 */
export type SectionState = "off" | "added" | "kept" | "removed";

export function isOn(state: SectionState): boolean {
  return state === "added" || state === "kept";
}

function flipped(set: ReadonlySet<DayKey>, key: DayKey): Set<DayKey> {
  const next = new Set(set);
  if (!next.delete(key)) next.add(key);
  return next;
}

/** The day `key`'s state; `planned` says whether the subject has any row there (cooked ones included: deselecting a day clears it entirely). */
export function dayState(changes: PlanChanges, key: DayKey, planned: boolean): SectionState {
  if (planned) return changes.removedDays.has(key) ? "removed" : "kept";
  return changes.addedDays.has(key) ? "added" : "off";
}

export function toggleDay(changes: PlanChanges, key: DayKey, planned: boolean): PlanChanges {
  return planned
    ? { ...changes, removedDays: flipped(changes.removedDays, key) }
    : { ...changes, addedDays: flipped(changes.addedDays, key) };
}

/** How many uneaten copies the pool should hold, given it holds `current`. */
export function poolCount(changes: PlanChanges, current: number): number {
  return changes.poolCount ?? current;
}

export function poolState(changes: PlanChanges, current: number): SectionState {
  const wanted = poolCount(changes, current);
  if (current === 0) return wanted > 0 ? "added" : "off";
  if (wanted === 0) return "removed";
  return wanted === current ? "kept" : "added";
}

/**
 * A tap on the pool: out if it's in; back in otherwise, to what the plan
 * holds when it holds some (the deselect undone), else one copy. An explicit
 * zero only where the plan holds copies (that is the deselect); with none
 * it is untouched again, so copies that arrive later read as kept.
 */
export function togglePool(changes: PlanChanges, current: number): PlanChanges {
  if (poolCount(changes, current) > 0) {
    return { ...changes, poolCount: current > 0 ? 0 : null };
  }
  return { ...changes, poolCount: current > 0 ? null : 1 };
}

/** The counter, clamped to 1…`MAX_POOL_COUNT`. Landing back on what the plan holds counts as untouched again. */
export function setPoolCount(changes: PlanChanges, count: number, current: number): PlanChanges {
  const clamped = Math.min(Math.max(count, 1), MAX_POOL_COUNT);
  return { ...changes, poolCount: clamped === current ? null : clamped };
}

/** Only placement state enters the selection math, never recipe data. `day` is `null` in the pool. */
export type Placement = { id: string; day: DayKey | null; eaten: boolean };

/** What a save does: a day per added day and `null` per extra pool copy to insert; rows to delete. */
export type Diff = { insertTargets: (DayKey | null)[]; deleteIds: string[] };

export function isEmptyDiff(diff: Diff): boolean {
  return diff.insertTargets.length === 0 && diff.deleteIds.length === 0;
}

/**
 * The save for `rows`, the subject's placements as the plan stands, in
 * creation order. Re-derived from the plan: an added day that got planned
 * meanwhile inserts nothing, a removed day whose rows are gone deletes
 * nothing, which is also what makes a retry after a half-applied save do
 * just the rest. Surplus pool copies go newest first.
 */
export function diff(changes: PlanChanges, rows: Placement[]): Diff {
  const plannedDays = new Set(rows.map((row) => row.day));
  const insertTargets: (DayKey | null)[] = [...changes.addedDays]
    .sort()
    .filter((key) => !plannedDays.has(key));
  const deleteIds = rows
    .filter((row) => row.day !== null && changes.removedDays.has(row.day))
    .map((row) => row.id);

  const poolRows = rows.filter((row) => row.day === null && !row.eaten);
  const wanted = poolCount(changes, poolRows.length);
  if (wanted > poolRows.length) {
    insertTargets.push(...Array<null>(wanted - poolRows.length).fill(null));
  } else if (wanted < poolRows.length) {
    deleteIds.push(...poolRows.slice(wanted).map((row) => row.id));
  }
  return { insertTargets, deleteIds };
}

/** The save button's promise. */
export type SaveAction =
  /** Nothing to save. */
  | { kind: "none" }
  /** Only days added: "Plan for N days". */
  | { kind: "planDays"; days: number }
  /** Only the pool, and it was empty: "Add to pool". */
  | { kind: "addToPool" }
  /** Anything that removes, or a mix: "Update plan". */
  | { kind: "update" };

export function saveAction(changes: PlanChanges, rows: Placement[]): SaveAction {
  const save = diff(changes, rows);
  if (isEmptyDiff(save)) return { kind: "none" };
  if (save.deleteIds.length > 0) return { kind: "update" };
  const { insertTargets } = save;
  const days = insertTargets.filter((target) => target !== null).length;
  const copies = insertTargets.length - days;
  if (copies === 0) return { kind: "planDays", days };
  const poolWasEmpty = !rows.some((row) => row.day === null && !row.eaten);
  return days === 0 && poolWasEmpty ? { kind: "addToPool" } : { kind: "update" };
}
