import { describe, expect, it, vi } from "vitest";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { parseCurrentProfile, userApi } from "./user.api";

describe("userApi", () => {
  it("parses the private current-profile contract", () => {
    expect(
      parseCurrentProfile({
        id: "user-id",
        username: "Mara",
        household_id: "household-id",
        language: "de",
        has_completed_survey: true,
        notification_preferences: {
          cooking_started: false,
          cooking_finished: true,
        },
      })
    ).toEqual({
      id: "user-id",
      username: "Mara",
      household_id: "household-id",
      language: "de",
      has_completed_survey: true,
      notification_preferences: {
        cooking_started: false,
        cooking_finished: true,
      },
    });
  });

  it("rejects a profile missing private contract fields", () => {
    expect(() =>
      parseCurrentProfile({
        id: "user-id",
        username: "Mara",
        household_id: null,
      })
    ).toThrow();
  });

  it("builds the current user from the auth event without reading the auth session", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        id: "user-id",
        username: "Mara",
        household_id: "household-id",
        language: "de",
        has_completed_survey: true,
        notification_preferences: null,
      },
      error: null,
    });
    const supabase = { rpc } as unknown as SupabaseClient<Database>;

    await expect(
      userApi.getCurrent(supabase, {
        id: "user-id",
        email: "mara@example.com",
        created_at: "2026-07-26T20:31:55Z",
      })
    ).resolves.toEqual({
      id: "user-id",
      email: "mara@example.com",
      username: "Mara",
      household_id: "household-id",
      language: "de",
      has_completed_survey: true,
      notification_preferences: null,
      created_at: "2026-07-26T20:31:55Z",
    });
    expect(rpc).toHaveBeenCalledWith("get_current_profile");
  });

  it("rejects a profile returned for a different authenticated account", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: {
          id: "different-user-id",
          username: "Mara",
          household_id: null,
          language: "en",
          has_completed_survey: true,
          notification_preferences: null,
        },
        error: null,
      }),
    } as unknown as SupabaseClient<Database>;

    await expect(
      userApi.getCurrent(supabase, {
        id: "auth-user-id",
        email: "mara@example.com",
        created_at: "2026-07-26T20:31:55Z",
      })
    ).rejects.toThrow("did not match");
  });
});
