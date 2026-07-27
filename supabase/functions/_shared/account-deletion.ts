export interface RpcResult<T = unknown> {
  data: T | null;
  error: { message: string; status?: number } | null;
}

export interface AccountDeletionAdminClient {
  rpc(name: string, parameters?: Record<string, unknown>): PromiseLike<RpcResult>;
  auth: {
    admin: {
      deleteUser(userID: string, shouldSoftDelete?: boolean): PromiseLike<RpcResult>;
    };
  };
}

export interface AccountDeletionClaim {
  request_id: string;
  subject_user_id: string;
  storage_status: "pending" | "succeeded";
  posthog_status: "pending" | "succeeded";
  revenuecat_status: "pending" | "succeeded";
  auth_status: "pending" | "succeeded";
  lease_token: string;
  lease_expires_at: string;
  attempt_count: number;
}

export interface AccountDeletionConfiguration {
  postHog: {
    host: string;
    projectID: string;
    personalAPIKey: string;
  } | null;
  revenueCat: {
    projectID: string;
    secretAPIKey: string;
  } | null;
  timeoutMilliseconds?: number;
}

export interface AccountDeletionStatus {
  request_id?: string;
  status: "pending" | "processing" | "completed" | null;
  retry_after_seconds?: number;
}

type FetchImplementation = typeof fetch;

export class AccountDeletionFailure extends Error {
  constructor(
    readonly code: string,
    readonly retryAfterSeconds: number,
    readonly providerStatus: number | null = null
  ) {
    super(code);
  }
}

/** Claims and advances one durable deletion job. Every provider operation is
 * idempotent; a crash after the HTTP response but before the RPC commit is safe
 * to retry. The Auth user is deleted only after both provider erasures were
 * accepted. */
export async function processAccountDeletionJob(
  admin: AccountDeletionAdminClient,
  configuration: AccountDeletionConfiguration,
  requestID: string | null,
  fetchImplementation: FetchImplementation = fetch
): Promise<AccountDeletionStatus | null> {
  const { data: claimData, error: claimError } = await admin.rpc("claim_account_deletion_job", {
    p_request_id: requestID,
    p_lease_seconds: 120,
  });
  if (claimError) throw new Error("account_deletion_claim_failed");

  const claim = firstClaim(claimData);
  if (!claim) return requestID ? await serviceStatus(admin, requestID) : null;

  try {
    if (claim.posthog_status !== "succeeded") {
      await erasePostHogIdentity(
        configuration.postHog,
        claim.subject_user_id,
        configuration.timeoutMilliseconds,
        fetchImplementation
      );
      await recordStep(admin, claim, "posthog", 202);
      claim.posthog_status = "succeeded";
    }

    if (claim.revenuecat_status !== "succeeded") {
      const status = await eraseRevenueCatIdentity(
        configuration.revenueCat,
        claim.subject_user_id,
        configuration.timeoutMilliseconds,
        fetchImplementation
      );
      await recordStep(admin, claim, "revenuecat", status);
      claim.revenuecat_status = "succeeded";
    }

    if (claim.auth_status !== "succeeded") {
      const { error } = await admin.auth.admin.deleteUser(claim.subject_user_id, false);
      if (error && error.status !== 404) {
        const status = error.status ?? null;
        throw new AccountDeletionFailure(
          isRetryableStatus(status) ? "auth_temporarily_unavailable" : "auth_delete_rejected",
          retryDelay(claim.attempt_count),
          status
        );
      }
      await recordStep(admin, claim, "auth", error?.status ?? 200);
    }
  } catch (error) {
    const failure = normalizeFailure(error, claim.attempt_count);
    const { data, error: retryError } = await admin.rpc("retry_account_deletion_job", {
      p_request_id: claim.request_id,
      p_lease_token: claim.lease_token,
      p_error_code: failure.code,
      p_provider_status: failure.providerStatus,
      p_retry_after_seconds: failure.retryAfterSeconds,
    });
    if (retryError || data !== true) {
      throw new Error("account_deletion_retry_commit_failed");
    }
    console.error("account_deletion_retry_scheduled", {
      code: failure.code,
      retry_after_seconds: failure.retryAfterSeconds,
    });
  }

  return await serviceStatus(admin, claim.request_id);
}

export async function erasePostHogIdentity(
  configuration: AccountDeletionConfiguration["postHog"],
  distinctID: string,
  timeoutMilliseconds = 10_000,
  fetchImplementation: FetchImplementation = fetch
): Promise<void> {
  if (!configuration) {
    throw new AccountDeletionFailure("posthog_configuration_missing", 3_600);
  }
  const baseURL = new URL(configuration.host);
  if (baseURL.protocol !== "https:") {
    throw new AccountDeletionFailure("posthog_configuration_invalid", 3_600);
  }
  const url = new URL(
    `/api/projects/${encodeURIComponent(configuration.projectID)}/persons/bulk_delete/`,
    baseURL
  );
  const response = await providerFetch(
    fetchImplementation,
    url,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${configuration.personalAPIKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Older native builds identified UUIDs with Foundation's uppercase
        // uuidString, while the web/Supabase value is lowercase. PostHog IDs
        // are case-sensitive, so erase both historical forms.
        distinct_ids: [...new Set([distinctID.toLowerCase(), distinctID.toUpperCase()])],
        delete_events: true,
        delete_recordings: true,
        keep_person: false,
      }),
    },
    timeoutMilliseconds,
    "posthog"
  );
  if (response.status !== 202) {
    throw responseFailure("posthog", response.status);
  }

  const body = await safeJSON(response, "posthog_invalid_response");
  const personsFound = nonnegativeInteger(body.persons_found);
  const personsDeleted = nonnegativeInteger(body.persons_deleted);
  const deletionErrors = body.deletion_errors ?? [];
  if (
    personsFound === null ||
    personsDeleted === null ||
    personsDeleted !== personsFound ||
    !Array.isArray(deletionErrors) ||
    deletionErrors.length > 0
  ) {
    throw new AccountDeletionFailure("posthog_invalid_response", 3_600, 202);
  }
  if (
    personsFound > 0 &&
    (body.events_queued_for_deletion !== true || body.recordings_queued_for_deletion !== true)
  ) {
    throw new AccountDeletionFailure("posthog_deletion_incomplete", 3_600, 202);
  }
}

export async function eraseRevenueCatIdentity(
  configuration: AccountDeletionConfiguration["revenueCat"],
  appUserID: string,
  timeoutMilliseconds = 10_000,
  fetchImplementation: FetchImplementation = fetch
): Promise<number> {
  if (!configuration) {
    throw new AccountDeletionFailure("revenuecat_configuration_missing", 3_600);
  }
  const project = encodeURIComponent(configuration.projectID);
  const customerIDs = new Set<string>();
  // RevenueCat App User IDs are case-sensitive. Native historically sent an
  // uppercase UUID, while web sent the lowercase Supabase UUID.
  for (const candidate of new Set([appUserID.toLowerCase(), appUserID.toUpperCase()])) {
    const getURL = new URL(
      `https://api.revenuecat.com/v2/projects/${project}/customers/${encodeURIComponent(candidate)}`
    );
    const response = await revenueCatFetch(
      fetchImplementation,
      getURL,
      configuration.secretAPIKey,
      { method: "GET" },
      timeoutMilliseconds
    );
    if (response.status === 404) continue;
    if (response.status !== 200) {
      throw responseFailure("revenuecat", response.status);
    }
    const body = await safeJSON(response, "revenuecat_invalid_response");
    if (typeof body.id !== "string" || !body.id) {
      throw new AccountDeletionFailure("revenuecat_invalid_response", 3_600, 200);
    }
    customerIDs.add(body.id);
  }

  let acceptedStatus = customerIDs.size === 0 ? 404 : 200;
  for (const customerID of customerIDs) {
    await assertRevenueCatCustomerExclusive(
      fetchImplementation,
      configuration,
      customerID,
      appUserID,
      timeoutMilliseconds
    );
    const deleteURL = new URL(
      `https://api.revenuecat.com/v2/projects/${project}/customers/${encodeURIComponent(
        customerID
      )}`
    );
    const response = await revenueCatFetch(
      fetchImplementation,
      deleteURL,
      configuration.secretAPIKey,
      { method: "DELETE" },
      timeoutMilliseconds
    );
    if (![200, 202, 404].includes(response.status)) {
      throw responseFailure("revenuecat", response.status);
    }
    if (response.status === 202) acceptedStatus = 202;
  }
  return acceptedStatus;
}

async function assertRevenueCatCustomerExclusive(
  fetchImplementation: FetchImplementation,
  configuration: NonNullable<AccountDeletionConfiguration["revenueCat"]>,
  customerID: string,
  appUserID: string,
  timeoutMilliseconds: number
): Promise<void> {
  const url = new URL(
    `https://api.revenuecat.com/v2/projects/${encodeURIComponent(
      configuration.projectID
    )}/customers/${encodeURIComponent(customerID)}/aliases`
  );
  url.searchParams.set("limit", "100");
  const response = await revenueCatFetch(
    fetchImplementation,
    url,
    configuration.secretAPIKey,
    { method: "GET" },
    timeoutMilliseconds
  );
  if (response.status !== 200) {
    throw responseFailure("revenuecat", response.status);
  }
  const body = await safeJSON(response, "revenuecat_invalid_response");
  if (!Array.isArray(body.items) || body.next_page) {
    throw new AccountDeletionFailure("revenuecat_invalid_response", 3_600, 200);
  }
  const aliases = body.items
    .map((item) =>
      item && typeof item === "object" && typeof item.id === "string" ? item.id : null
    )
    .filter((value): value is string => Boolean(value));
  const normalizedAppUserID = appUserID.toLowerCase();
  if (!aliases.some((alias) => alias.toLowerCase() === normalizedAppUserID)) {
    throw new AccountDeletionFailure("revenuecat_customer_ambiguous", 3_600, 200);
  }
  const foreignIdentity = aliases.find(
    (alias) => alias.toLowerCase() !== normalizedAppUserID && !alias.startsWith("$RCAnonymousID:")
  );
  if (foreignIdentity) {
    throw new AccountDeletionFailure("revenuecat_alias_review_required", 21_600, 200);
  }
}

async function recordStep(
  admin: AccountDeletionAdminClient,
  claim: AccountDeletionClaim,
  step: "posthog" | "revenuecat" | "auth",
  providerStatus: number
): Promise<void> {
  const { data, error } = await admin.rpc("record_account_deletion_step", {
    p_request_id: claim.request_id,
    p_lease_token: claim.lease_token,
    p_step: step,
    p_provider_status: providerStatus,
  });
  if (error || data !== true) {
    throw new Error("account_deletion_step_commit_failed");
  }
}

async function serviceStatus(
  admin: AccountDeletionAdminClient,
  requestID: string
): Promise<AccountDeletionStatus> {
  const { data, error } = await admin.rpc("get_account_deletion_job_status_for_service", {
    p_request_id: requestID,
  });
  if (error || !data || typeof data !== "object") {
    throw new Error("account_deletion_status_failed");
  }
  return data as AccountDeletionStatus;
}

function firstClaim(value: unknown): AccountDeletionClaim | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || typeof candidate !== "object") return null;
  const claim = candidate as Partial<AccountDeletionClaim>;
  if (
    typeof claim.request_id !== "string" ||
    typeof claim.subject_user_id !== "string" ||
    typeof claim.lease_token !== "string" ||
    typeof claim.attempt_count !== "number"
  ) {
    throw new Error("account_deletion_claim_invalid");
  }
  return claim as AccountDeletionClaim;
}

async function providerFetch(
  fetchImplementation: FetchImplementation,
  url: URL,
  init: RequestInit,
  timeoutMilliseconds: number,
  provider: "posthog" | "revenuecat"
): Promise<Response> {
  try {
    return await fetchImplementation(url, {
      ...init,
      signal: AbortSignal.timeout(timeoutMilliseconds),
    });
  } catch {
    throw new AccountDeletionFailure(`${provider}_unavailable`, 30);
  }
}

function revenueCatFetch(
  fetchImplementation: FetchImplementation,
  url: URL,
  secret: string,
  init: RequestInit,
  timeoutMilliseconds: number
): Promise<Response> {
  return providerFetch(
    fetchImplementation,
    url,
    {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
    },
    timeoutMilliseconds,
    "revenuecat"
  );
}

async function safeJSON(response: Response, errorCode: string): Promise<Record<string, unknown>> {
  try {
    const value = await response.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw 0;
    return value as Record<string, unknown>;
  } catch {
    throw new AccountDeletionFailure(errorCode, 3_600, response.status);
  }
}

function responseFailure(
  provider: "posthog" | "revenuecat",
  status: number
): AccountDeletionFailure {
  return new AccountDeletionFailure(
    isRetryableStatus(status)
      ? `${provider}_temporarily_unavailable`
      : `${provider}_request_rejected`,
    isRetryableStatus(status) ? 30 : 3_600,
    status
  );
}

function isRetryableStatus(status: number | null): boolean {
  return (
    status === null ||
    status === 408 ||
    status === 409 ||
    status === 423 ||
    status === 429 ||
    status >= 500
  );
}

function retryDelay(attempt: number): number {
  return Math.min(30 * 2 ** Math.max(0, attempt - 1), 21_600);
}

function normalizeFailure(error: unknown, attempt: number): AccountDeletionFailure {
  if (error instanceof AccountDeletionFailure) return error;
  return new AccountDeletionFailure("account_deletion_worker_unavailable", retryDelay(attempt));
}

function nonnegativeInteger(value: unknown): number | null {
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : null;
}
