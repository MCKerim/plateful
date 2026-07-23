import { describe, expect, it, vi } from "vitest";
import { householdApi } from "./household.api";

describe("householdApi", () => {
  it("creates and attaches a household through one server-owned RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: "household-id",
      error: null,
    });

    const result = await householdApi.create({ rpc } as never, {
      name: "Miller Family",
    });

    expect(result).toBe("household-id");
    expect(rpc).toHaveBeenCalledWith("create_household", {
      p_name: "Miller Family",
    });
  });

  it("leaves without accepting a client-supplied user or household identifier", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: "ownership_transferred",
      error: null,
    });

    const result = await householdApi.leaveHousehold({ rpc } as never);

    expect(result).toBe("ownership_transferred");
    expect(rpc).toHaveBeenCalledWith("leave_household");
  });

  it("uses owner-authorized RPCs for member removal and ownership transfer", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = { rpc } as never;

    await householdApi.removeMember(supabase, { memberId: "member-id" });
    await householdApi.transferOwnership(supabase, { newOwnerId: "new-owner-id" });

    expect(rpc).toHaveBeenNthCalledWith(1, "remove_household_member", {
      p_member_id: "member-id",
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "transfer_household_ownership", {
      p_member_id: "new-owner-id",
    });
  });

  it("rejects an unknown leave result instead of applying ambiguous local state", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: "unexpected_status",
      error: null,
    });

    await expect(householdApi.leaveHousehold({ rpc } as never)).rejects.toThrow(
      "invalid leave result"
    );
  });
});
