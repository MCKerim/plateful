import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";

export interface AccountDeletionSuccessor {
  id: string;
  username: string;
}

export interface AccountDeletionContext {
  householdName: string | null;
  isOwner: boolean;
  requiresSuccessor: boolean;
  eligibleSuccessors: AccountDeletionSuccessor[];
  deletesHousehold: boolean;
  isSubscriptionPayer: boolean;
  subscriptionExpiresAt: string | null;
}

function object(value: Json | unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("invalid_account_deletion_response");
  }
  return value as Record<string, unknown>;
}

function optionalString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new Error("invalid_account_deletion_response");
  return value;
}

function boolean(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("invalid_account_deletion_response");
  return value;
}

export function parseAccountDeletionContext(value: Json): AccountDeletionContext {
  const data = object(value);
  if (!Array.isArray(data.eligible_successors)) {
    throw new Error("invalid_account_deletion_response");
  }
  const eligibleSuccessors = data.eligible_successors.map((candidate) => {
    const successor = object(candidate);
    const id = optionalString(successor.id);
    const username = optionalString(successor.username);
    if (!id || !username) throw new Error("invalid_account_deletion_response");
    return { id, username };
  });

  return {
    householdName: optionalString(data.household_name),
    isOwner: boolean(data.is_owner),
    requiresSuccessor: boolean(data.requires_successor),
    eligibleSuccessors,
    deletesHousehold: boolean(data.deletes_household),
    isSubscriptionPayer: boolean(data.is_subscription_payer),
    subscriptionExpiresAt: optionalString(data.subscription_expires_at),
  };
}

export async function loadAccountDeletionContext(
  supabase: SupabaseClient<Database>
): Promise<AccountDeletionContext> {
  const { data, error } = await supabase.rpc("get_account_deletion_context");
  if (error) throw error;
  return parseAccountDeletionContext(data);
}

/**
 * Asks the server to delete the account. The Auth user is deleted inside this
 * request, so any 2xx (200 or 202) means the account is gone and the current
 * session is dead; the body only describes the background erasure at PostHog
 * and RevenueCat, which this client never watches. A 409 (for example
 * `requires_successor`) or any other error means nothing was deleted.
 */
export async function requestAccountDeletion(
  supabase: SupabaseClient<Database>,
  requestId: string,
  successorUserId: string | null
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new AccountDeletionRequestError("unauthorized", 401);

  const { error } = await supabase.functions.invoke("delete-account", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: {
      operation: "request",
      request_id: requestId,
      successor_user_id: successorUserId,
    },
  });
  if (error) {
    throw new AccountDeletionRequestError(
      "account_deletion_request_failed",
      functionErrorStatus(error)
    );
  }
}

export class AccountDeletionRequestError extends Error {
  constructor(
    readonly code: string,
    readonly status: number | null
  ) {
    super(code);
  }
}

function functionErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const context = "context" in error ? error.context : null;
  if (context && typeof context === "object" && "status" in context) {
    const status = context.status;
    return typeof status === "number" ? status : null;
  }
  return null;
}
