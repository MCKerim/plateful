import { beforeEach, describe, expect, it } from "vitest";
import {
  AccountDeletionRequestError,
  clearStoredDeletionRequest,
  isAccountDeletionRequestNotFound,
  isAccountDeletionUnauthorized,
  parseAccountDeletionContext,
  parseAccountDeletionStatus,
  storeDeletionRequest,
  storedDeletionRequest,
} from "./accountDeletion";

describe("account deletion contract", () => {
  beforeEach(clearStoredDeletionRequest);

  it("parses owner transfer and subscription preflight", () => {
    const context = parseAccountDeletionContext({
      request_id: null,
      status: null,
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

  it("parses processing and completed worker receipts", () => {
    const processing = parseAccountDeletionContext({
      request_id: "f0040000-0000-4000-8000-000000000050",
      status: "processing",
      retry_after_seconds: 12,
    });
    const completed = parseAccountDeletionStatus({
      request_id: "f0040000-0000-4000-8000-000000000050",
      status: "completed",
      retry_after_seconds: 1,
    });

    expect(processing.retryAfterSeconds).toBe(12);
    expect(completed.status).toBe("completed");
  });

  it("scopes the recovery receipt to the account that requested deletion", () => {
    storeDeletionRequest(
      "f0040000-0000-4000-8000-000000000001",
      "f0040000-0000-4000-8000-000000000050"
    );

    expect(storedDeletionRequest("f0040000-0000-4000-8000-000000000001")?.requestId).toBe(
      "f0040000-0000-4000-8000-000000000050"
    );
    expect(storedDeletionRequest("f0040000-0000-4000-8000-000000000099")).toBeNull();
  });

  it("only treats an Auth 401 as deletion completion", () => {
    expect(
      isAccountDeletionUnauthorized(new AccountDeletionRequestError("unauthorized", 401))
    ).toBe(true);
    expect(isAccountDeletionUnauthorized(new AccountDeletionRequestError("forbidden", 403))).toBe(
      false
    );
    expect(isAccountDeletionUnauthorized(new AccountDeletionRequestError("missing", 404))).toBe(
      false
    );
  });

  it("distinguishes an orphaned local receipt from completed Auth deletion", () => {
    expect(
      isAccountDeletionRequestNotFound(new AccountDeletionRequestError("missing", 404))
    ).toBe(true);
    expect(
      isAccountDeletionRequestNotFound(new AccountDeletionRequestError("unauthorized", 401))
    ).toBe(false);
  });
});
