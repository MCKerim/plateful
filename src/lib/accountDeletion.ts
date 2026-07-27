import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";

const STORAGE_KEY = "plateful.accountDeletionRequest";

export const ACCOUNT_DELETION_REQUESTED_EVENT = "plateful:account-deletion-requested";

export interface AccountDeletionSuccessor {
  id: string;
  username: string;
}

export interface AccountDeletionContext {
  requestId: string | null;
  status: "pending" | "processing" | null;
  retryAfterSeconds: number;
  householdName: string | null;
  isOwner: boolean;
  requiresSuccessor: boolean;
  eligibleSuccessors: AccountDeletionSuccessor[];
  deletesHousehold: boolean;
  isSubscriptionPayer: boolean;
  subscriptionExpiresAt: string | null;
}

export interface AccountDeletionStatus {
  requestId: string;
  status: "pending" | "processing" | "completed";
  retryAfterSeconds: number;
}

interface StoredDeletionRequest {
  userId: string;
  requestId: string;
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

function retryAfter(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(60, Math.max(1, Math.ceil(value)))
    : 2;
}

export function parseAccountDeletionContext(value: Json): AccountDeletionContext {
  const data = object(value);
  const requestId = optionalString(data.request_id);
  const status = data.status;
  if (requestId) {
    if (status !== "pending" && status !== "processing") {
      throw new Error("invalid_account_deletion_response");
    }
    return {
      requestId,
      status,
      retryAfterSeconds: retryAfter(data.retry_after_seconds),
      householdName: null,
      isOwner: false,
      requiresSuccessor: false,
      eligibleSuccessors: [],
      deletesHousehold: false,
      isSubscriptionPayer: false,
      subscriptionExpiresAt: null,
    };
  }

  if (status !== null && status !== undefined) {
    throw new Error("invalid_account_deletion_response");
  }
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
    requestId: null,
    status: null,
    retryAfterSeconds: 2,
    householdName: optionalString(data.household_name),
    isOwner: boolean(data.is_owner),
    requiresSuccessor: boolean(data.requires_successor),
    eligibleSuccessors,
    deletesHousehold: boolean(data.deletes_household),
    isSubscriptionPayer: boolean(data.is_subscription_payer),
    subscriptionExpiresAt: optionalString(data.subscription_expires_at),
  };
}

export function parseAccountDeletionStatus(value: unknown): AccountDeletionStatus {
  const data = object(value);
  const requestId = optionalString(data.request_id);
  if (!requestId) throw new Error("invalid_account_deletion_response");
  const status = data.status;
  if (status !== "pending" && status !== "processing" && status !== "completed") {
    throw new Error("invalid_account_deletion_response");
  }
  return {
    requestId,
    status,
    retryAfterSeconds: retryAfter(data.retry_after_seconds),
  };
}

export async function loadAccountDeletionContext(
  supabase: SupabaseClient<Database>
): Promise<AccountDeletionContext> {
  const { data, error } = await supabase.rpc("get_account_deletion_context");
  if (error) throw error;
  return parseAccountDeletionContext(data);
}

async function invokeDeletion(
  supabase: SupabaseClient<Database>,
  body: Record<string, unknown>
): Promise<AccountDeletionStatus> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new AccountDeletionRequestError("unauthorized", 401);

  const { data, error } = await supabase.functions.invoke("delete-account", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
    body,
  });
  if (error) {
    const status = functionErrorStatus(error);
    throw new AccountDeletionRequestError("account_deletion_request_failed", status);
  }
  return parseAccountDeletionStatus(data);
}

export function requestAccountDeletion(
  supabase: SupabaseClient<Database>,
  requestId: string,
  successorUserId: string | null
): Promise<AccountDeletionStatus> {
  return invokeDeletion(supabase, {
    operation: "request",
    request_id: requestId,
    successor_user_id: successorUserId,
  });
}

export function advanceAccountDeletion(
  supabase: SupabaseClient<Database>,
  requestId: string
): Promise<AccountDeletionStatus> {
  return invokeDeletion(supabase, { operation: "status", request_id: requestId });
}

export class AccountDeletionRequestError extends Error {
  constructor(
    readonly code: string,
    readonly status: number | null
  ) {
    super(code);
  }
}

export function isAccountDeletionUnauthorized(error: unknown): boolean {
  return error instanceof AccountDeletionRequestError && error.status === 401;
}

export function isAccountDeletionRequestNotFound(error: unknown): boolean {
  return error instanceof AccountDeletionRequestError && error.status === 404;
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

export function storedDeletionRequest(userId: string): StoredDeletionRequest | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<StoredDeletionRequest>;
    if (value.userId !== userId || typeof value.requestId !== "string") {
      return null;
    }
    return { userId, requestId: value.requestId };
  } catch {
    return null;
  }
}

export function storeDeletionRequest(userId: string, requestId: string): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, requestId }));
}

export function clearStoredDeletionRequest(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function announceAccountDeletionRequest(): void {
  window.dispatchEvent(new Event(ACCOUNT_DELETION_REQUESTED_EVENT));
}
