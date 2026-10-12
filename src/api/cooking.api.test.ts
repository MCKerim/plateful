import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { cookingApi } from "@/api/cooking.api";
import type { CookingSessionRow } from "@/lib/cooking/session";

const NOW = Date.parse("2026-07-10T20:00:00Z");

function sessionRow(startedAt: string): CookingSessionRow {
  return {
    id: "existing",
    household_id: "h1",
    recipe_id: "r1",
    started_by: "u1",
    target_servings: 4,
    status: "active",
    started_at: startedAt,
    ended_at: null,
  };
}

/** A client that answers the active-session read from `active` and records every write. */
function fakeClient(active: CookingSessionRow | null) {
  const writes: string[] = [];
  const from = (table: string) => {
    const builder: Record<string, unknown> = {};
    for (const method of ["select", "eq", "gte", "order", "limit", "in"]) builder[method] = () => builder;
    for (const method of ["insert", "update", "delete", "upsert"]) {
      builder[method] = (payload?: Record<string, unknown>) => {
        writes.push(`${table}.${method}${payload?.status ? `:${payload.status}` : ""}`);
        return builder;
      };
    }
    builder.maybeSingle = async () => ({ data: active, error: null });
    builder.single = async () => ({ data: { ...sessionRow(new Date(NOW).toISOString()), id: "created" }, error: null });
    builder.then = (resolve: (value: { data: null; error: null }) => void) =>
      resolve({ data: null, error: null });
    return builder;
  };
  return { client: { from } as unknown as SupabaseClient<Database>, writes };
}

const PARAMS = { recipeId: "r1", householdId: "h1", userId: "u1", targetServings: 4, now: NOW };

describe("cookingApi.resolveSession", () => {
  it("resumes and joins a session from earlier today", async () => {
    const { client, writes } = fakeClient(sessionRow("2026-07-10T18:00:00Z"));
    const result = await cookingApi.resolveSession(client, PARAMS);
    expect(result).toEqual({ session: sessionRow("2026-07-10T18:00:00Z"), created: false });
    expect(writes).toEqual(["cooking_session_participants.upsert"]);
  });

  it("abandons yesterday's session, its timers with it, and starts a fresh one", async () => {
    const { client, writes } = fakeClient(sessionRow("2026-07-09T19:00:00Z"));
    const result = await cookingApi.resolveSession(client, PARAMS);
    expect(result.created).toBe(true);
    expect(result.session.id).toBe("created");
    expect(writes).toEqual([
      "cooking_session_timers.delete",
      "cooking_sessions.update:abandoned",
      "cooking_sessions.insert",
      "cooking_session_participants.upsert",
    ]);
  });

  it("starts and joins a session when none runs", async () => {
    const { client, writes } = fakeClient(null);
    const result = await cookingApi.resolveSession(client, PARAMS);
    expect(result.created).toBe(true);
    expect(writes).toEqual(["cooking_sessions.insert", "cooking_session_participants.upsert"]);
  });
});
