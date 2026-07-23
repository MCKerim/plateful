import { describe, expect, it, vi } from "vitest";
import {
  getInviteJoinRequirement,
  inviteApi,
  parseAcceptInviteResult,
  parseInvitePreview,
} from "./invite.api";

describe("inviteApi", () => {
  it("parses only the narrow fields needed to preview one exact invite", () => {
    expect(
      parseInvitePreview({
        status: "ready",
        household_id: "household-id",
        household_name: "Miller Family",
        expires_at: "2026-07-24T12:00:00Z",
      })
    ).toEqual({
      status: "ready",
      householdId: "household-id",
      householdName: "Miller Family",
      expiresAt: "2026-07-24T12:00:00Z",
    });
  });

  it("rejects malformed preview and acceptance contracts", () => {
    expect(() =>
      parseInvitePreview({
        status: "ready",
        household_id: "household-id",
      })
    ).toThrow();

    expect(() =>
      parseAcceptInviteResult({
        status: "joined",
      })
    ).toThrow();
  });

  it("requires leaving before joining a different household", () => {
    expect(getInviteJoinRequirement(null, "invited")).toBe("can_join");
    expect(getInviteJoinRequirement("invited", "invited")).toBe("already_member");
    expect(getInviteJoinRequirement("current", "invited")).toBe("must_leave_current_household");
  });

  it("creates and accepts invites through exact RPC calls", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: "invite-token", error: null })
      .mockResolvedValueOnce({
        data: { status: "joined", household_id: "household-id" },
        error: null,
      });
    const supabase = { rpc } as never;

    await expect(inviteApi.create(supabase)).resolves.toBe("invite-token");
    await expect(inviteApi.accept(supabase, "invite-token")).resolves.toEqual({
      status: "joined",
      householdId: "household-id",
    });

    expect(rpc).toHaveBeenNthCalledWith(1, "create_household_invite");
    expect(rpc).toHaveBeenNthCalledWith(2, "accept_household_invite", {
      p_token: "invite-token",
    });
  });
});
