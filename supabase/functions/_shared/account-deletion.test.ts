import { describe, expect, it, vi } from "vitest";
import {
  AccountDeletionAdminClient,
  AccountDeletionClaim,
  AccountDeletionConfiguration,
  erasePostHogIdentity,
  eraseRevenueCatIdentity,
  processAccountDeletionJob,
} from "./account-deletion";

const userID = "f0040000-0000-4000-8000-000000000001";
const requestID = "f0040000-0000-4000-8000-000000000050";

function claim(overrides: Partial<AccountDeletionClaim> = {}): AccountDeletionClaim {
  return {
    request_id: requestID,
    subject_user_id: userID,
    storage_status: "succeeded",
    posthog_status: "pending",
    revenuecat_status: "pending",
    auth_status: "pending",
    lease_token: "f0040000-0000-4000-8000-000000000051",
    lease_expires_at: new Date(Date.now() + 120_000).toISOString(),
    attempt_count: 1,
    ...overrides,
  };
}

function config(): AccountDeletionConfiguration {
  return {
    postHog: {
      host: "https://eu.posthog.com",
      projectID: "123",
      personalAPIKey: "phx_test",
    },
    revenueCat: {
      projectID: "proj_test",
      secretAPIKey: "sk_test",
    },
  };
}

describe("account deletion worker", () => {
  it("erases providers before Auth and records every durable step", async () => {
    const events: string[] = [];
    const rpc = vi.fn(async (name: string) => {
      if (name === "claim_account_deletion_job") return { data: [claim()], error: null };
      if (name === "record_account_deletion_step") {
        events.push("record");
        return { data: true, error: null };
      }
      if (name === "get_account_deletion_job_status_for_service") {
        return { data: { request_id: requestID, status: "completed" }, error: null };
      }
      throw new Error(name);
    });
    const deleteUser = vi.fn(async () => {
      events.push("auth");
      return { data: {}, error: null };
    });
    const admin = { rpc, auth: { admin: { deleteUser } } } as AccountDeletionAdminClient;
    const fetchMock = vi.fn(async (input: URL | RequestInfo, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("posthog")) {
        events.push("posthog");
        expect(JSON.parse(String(init?.body)).distinct_ids).toEqual([
          userID.toLowerCase(),
          userID.toUpperCase(),
        ]);
        return new Response(
          JSON.stringify({
            persons_found: 1,
            persons_deleted: 1,
            events_queued_for_deletion: true,
            recordings_queued_for_deletion: true,
          }),
          { status: 202 }
        );
      }
      if (url.endsWith(`/customers/${userID.toLowerCase()}`)) {
        events.push("revenuecat-get-lower");
        return new Response(JSON.stringify({ id: "cust_1" }), { status: 200 });
      }
      if (url.endsWith(`/customers/${userID.toUpperCase()}`)) {
        events.push("revenuecat-get-upper");
        return new Response(JSON.stringify({ id: "cust_1" }), { status: 200 });
      }
      if (url.includes("/aliases")) {
        events.push("revenuecat-aliases");
        return new Response(
          JSON.stringify({
            items: [{ id: userID }, { id: "$RCAnonymousID:anonymous" }],
          }),
          { status: 200 }
        );
      }
      if (init?.method === "DELETE") {
        events.push("revenuecat-delete");
        return new Response(null, { status: 202 });
      }
      throw new Error(url);
    });

    const status = await processAccountDeletionJob(
      admin,
      config(),
      requestID,
      fetchMock as typeof fetch
    );

    expect(status?.status).toBe("completed");
    expect(events).toEqual([
      "posthog",
      "record",
      "revenuecat-get-lower",
      "revenuecat-get-upper",
      "revenuecat-aliases",
      "revenuecat-delete",
      "record",
      "auth",
      "record",
    ]);
  });

  it("keeps the job retryable and does not delete Auth when provider config is missing", async () => {
    const retry = vi.fn();
    const rpc = vi.fn(async (name: string, parameters?: Record<string, unknown>) => {
      if (name === "claim_account_deletion_job") return { data: [claim()], error: null };
      if (name === "retry_account_deletion_job") {
        retry(parameters);
        return { data: true, error: null };
      }
      if (name === "get_account_deletion_job_status_for_service") {
        return { data: { request_id: requestID, status: "pending" }, error: null };
      }
      throw new Error(name);
    });
    const deleteUser = vi.fn();
    const admin = { rpc, auth: { admin: { deleteUser } } } as AccountDeletionAdminClient;

    const status = await processAccountDeletionJob(
      admin,
      { postHog: null, revenueCat: null },
      requestID
    );

    expect(status?.status).toBe("pending");
    expect(deleteUser).not.toHaveBeenCalled();
    expect(retry.mock.calls[0][0]).toMatchObject({
      p_error_code: "posthog_configuration_missing",
      p_retry_after_seconds: 3600,
    });
  });

  it("does not repeat provider steps already committed", async () => {
    const rpc = vi.fn(async (name: string) => {
      if (name === "claim_account_deletion_job") {
        return {
          data: [claim({ posthog_status: "succeeded", revenuecat_status: "succeeded" })],
          error: null,
        };
      }
      if (name === "record_account_deletion_step") return { data: true, error: null };
      if (name === "get_account_deletion_job_status_for_service") {
        return { data: { request_id: requestID, status: "completed" }, error: null };
      }
      throw new Error(name);
    });
    const deleteUser = vi.fn(async () => ({ data: {}, error: null }));
    const admin = { rpc, auth: { admin: { deleteUser } } } as AccountDeletionAdminClient;
    const fetchMock = vi.fn();

    await processAccountDeletionJob(admin, config(), requestID, fetchMock as typeof fetch);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(deleteUser).toHaveBeenCalledOnce();
  });
});

describe("account deletion providers", () => {
  it("rejects a partial PostHog person deletion", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            persons_found: 2,
            persons_deleted: 1,
            events_queued_for_deletion: true,
            recordings_queued_for_deletion: true,
          }),
          { status: 202 }
        )
    );

    await expect(
      erasePostHogIdentity(config().postHog, userID, 10_000, fetchMock as typeof fetch)
    ).rejects.toMatchObject({ code: "posthog_invalid_response" });
  });

  it("rejects an incomplete PostHog bulk deletion response", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            persons_found: 1,
            persons_deleted: 1,
            events_queued_for_deletion: false,
            recordings_queued_for_deletion: true,
            deletion_errors: [],
          }),
          { status: 202 }
        )
    );

    await expect(
      erasePostHogIdentity(config().postHog, userID, 10_000, fetchMock as typeof fetch)
    ).rejects.toMatchObject({ code: "posthog_deletion_incomplete" });
  });

  it("refuses to delete a RevenueCat customer shared with another identified account", async () => {
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      const url = String(input);
      if (url.includes("/aliases")) {
        return new Response(
          JSON.stringify({
            items: [{ id: userID }, { id: "f0040000-0000-4000-8000-000000000099" }],
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ id: "cust_1" }), { status: 200 });
    });

    await expect(
      eraseRevenueCatIdentity(config().revenueCat, userID, 10_000, fetchMock as typeof fetch)
    ).rejects.toMatchObject({ code: "revenuecat_alias_review_required" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
