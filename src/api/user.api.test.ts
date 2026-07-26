import { describe, expect, it } from "vitest";
import { parseCurrentProfile } from "./user.api";

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
});
