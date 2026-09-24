import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  AccountDeletionRequestError,
  parseAccountDeletionContext,
  requestAccountDeletion,
} from "./accountDeletion";

function fakeSupabase(invokeResult: { data: unknown; error: unknown }, session = true) {
  const invoke = vi.fn().mockResolvedValue(invokeResult);
  const supabase = {
    auth: {
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: session ? { access_token: "token" } : null } }),
    },
    functions: { invoke },
  } as unknown as SupabaseClient<Database>;
  return { supabase, invoke };
}

describe("account deletion contract", () => {
  it("parses owner transfer and subscription preflight", () => {
    const context = parseAccountDeletionContext({
      household_name: "Home",
      is_owner: true,
      requires_successor: true,
      eligible_successors: [{ id: "f0040000-0000-4000-8000-000000000002", username: "Alex" }],
      deletes_household: false,
      is_subscription_payer: true,
      subscription_expires_at: "2026-08-15T12:00:00Z",
    });

    expect(context.requiresSuccessor).toBe(true);
    expect(context.eligibleSuccessors.map((successor) => successor.username)).toEqual(["Alex"]);
    expect(context.isSubscriptionPayer).toBe(true);
  });

  it("rejects a preflight without the successor list", () => {
    // The shape the RPC answered with for a job still in flight under the old
    // auth-last flow. This client never resumes a deletion, so it is invalid.
    expect(() =>
      parseAccountDeletionContext({
        request_id: "f0040000-0000-4000-8000-000000000050",
        status: "processing",
        retry_after_seconds: 12,
      })
    ).toThrow("invalid_account_deletion_response");
  });

  it("treats any 2xx as the account being gone, whatever the body says", async () => {
    const { supabase, invoke } = fakeSupabase({
      data: { request_id: "r", status: "processing", retry_after_seconds: 30 },
      error: null,
    });

    await expect(requestAccountDeletion(supabase, "request-1", null)).resolves.toBeUndefined();
    expect(invoke).toHaveBeenCalledWith(
      "delete-account",
      expect.objectContaining({
        body: { operation: "request", request_id: "request-1", successor_user_id: null },
      })
    );
  });

  it("surfaces the HTTP status when the server refused", async () => {
    const { supabase } = fakeSupabase({ data: null, error: { context: { status: 409 } } });

    const failure = await requestAccountDeletion(supabase, "request-1", null).catch(
      (error: unknown) => error
    );

    expect(failure).toBeInstanceOf(AccountDeletionRequestError);
    expect((failure as AccountDeletionRequestError).status).toBe(409);
  });

  it("does not call the server without a session", async () => {
    const { supabase, invoke } = fakeSupabase({ data: null, error: null }, false);

    const failure = await requestAccountDeletion(supabase, "request-1", null).catch(
      (error: unknown) => error
    );

    expect((failure as AccountDeletionRequestError).status).toBe(401);
    expect(invoke).not.toHaveBeenCalled();
  });
});
