import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { CORS, ANSWEAR_HEADER } from "../_shared/headers.ts";

// This function is the ONLY writer of `household_subscriptions` (clients have
// no INSERT/UPDATE policies — a client-writable row would let anyone
// self-grant premium). Events reference the store customer; we map them to a
// Supabase user, then to their household.

const ACTIVE_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "UNCANCELLATION",
  "TRIAL_STARTED",
  "TRIAL_CONVERTED",
]);

// What actually revokes access:
// - EXPIRATION: the paid period (incl. any billing grace period) ended.
// - SUBSCRIPTION_PAUSED: Google Play pause took effect (no EXPIRATION follows).
// Deliberately NOT here:
// - CANCELLATION: fires when auto-renew is switched off; paid access continues
//   until EXPIRATION. The one exception is a refund (cancel_reason
//   CUSTOMER_SUPPORT), which revokes immediately — handled below.
// - BILLING_ISSUE: informational; during a billing grace period access should
//   continue, and EXPIRATION still fires when access really ends.
const REVOKE_EVENTS = new Set(["EXPIRATION", "SUBSCRIPTION_PAUSED"]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The Supabase user id among a customer's known ids. Events attributed to an
 * anonymous customer ("$RCAnonymousID:…") still carry the uuid in `aliases`. */
function supabaseUserId(...ids: unknown[]): string | undefined {
  return ids
    .flat()
    .find((id): id is string => typeof id === "string" && UUID_RE.test(id));
}

/** Points the user's household row at `isActive`, carrying the event's
 * expiry/store/environment for support visibility. No-op when the user is
 * unknown, not in a household, or the event is older than the last applied
 * one (a retried/stale delivery must not overwrite newer state). */
async function setHouseholdSubscription(
  supabase: SupabaseClient,
  userId: string | undefined,
  isActive: boolean,
  event: Record<string, unknown>
): Promise<{ error?: string }> {
  if (!userId) return {};

  const { data: userData } = await supabase
    .from("users")
    .select("id, household_id")
    .eq("id", userId)
    .single();

  if (!userData?.household_id) return {};

  const eventAt =
    typeof event.event_timestamp_ms === "number"
      ? new Date(event.event_timestamp_ms)
      : new Date();

  const { data: existing } = await supabase
    .from("household_subscriptions")
    .select("last_event_at")
    .eq("household_id", userData.household_id)
    .maybeSingle();

  if (existing?.last_event_at && eventAt < new Date(existing.last_event_at)) {
    console.log(
      `skipping stale event (${eventAt.toISOString()} < ${existing.last_event_at})`
    );
    return {};
  }

  const { error } = await supabase.from("household_subscriptions").upsert(
    {
      household_id: userData.household_id,
      payer_user_id: userData.id,
      is_active: isActive,
      expires_at:
        typeof event.expiration_at_ms === "number"
          ? new Date(event.expiration_at_ms).toISOString()
          : null,
      store: typeof event.store === "string" ? event.store : null,
      environment:
        typeof event.environment === "string" ? event.environment : null,
      last_event_at: eventAt.toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "household_id" }
  );

  if (error) {
    console.error("Error upserting household subscription:", error);
    return { error: error.message };
  }
  return {};
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  if (req.method !== "POST") {
    return new Response("Only POST allowed", { status: 405, headers: CORS });
  }

  // Validate shared secret
  const authHeader = req.headers.get("authorization");
  const webhookSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
  if (!webhookSecret || authHeader !== webhookSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: ANSWEAR_HEADER,
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: ANSWEAR_HEADER,
    });
  }

  const event = body?.event;
  if (!event) {
    return new Response("ok", { status: 200, headers: ANSWEAR_HEADER });
  }

  const eventType: string = event.type;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // TRANSFER moves the store subscription between customers (the same
  // Apple/Google account used while signed into different app accounts): the
  // losing side's household locks, the gaining side's unlocks.
  if (eventType === "TRANSFER") {
    const from = supabaseUserId(event.transferred_from);
    const to = supabaseUserId(event.transferred_to);
    console.log(`event=TRANSFER from=${from ?? "none"} to=${to ?? "none"}`);
    const results = [
      await setHouseholdSubscription(supabase, from, false, event),
      await setHouseholdSubscription(supabase, to, true, event),
    ];
    const failed = results.find((r) => r.error);
    if (failed) {
      return new Response(JSON.stringify({ error: failed.error }), {
        status: 500,
        headers: ANSWEAR_HEADER,
      });
    }
    return new Response("ok", { status: 200, headers: ANSWEAR_HEADER });
  }

  const isRefund =
    eventType === "CANCELLATION" && event.cancel_reason === "CUSTOMER_SUPPORT";
  const isActive = ACTIVE_EVENTS.has(eventType);
  const isInactive = REVOKE_EVENTS.has(eventType) || isRefund;

  if (!isActive && !isInactive) {
    return new Response("ok", { status: 200, headers: ANSWEAR_HEADER });
  }

  const rcUserId = supabaseUserId(
    event.app_user_id,
    event.original_app_user_id,
    event.aliases
  );

  console.log(
    `event=${eventType} app_user_id=${event.app_user_id} resolved_user=${rcUserId ?? "none"} is_active=${isActive}`
  );

  const { error } = await setHouseholdSubscription(supabase, rcUserId, isActive, event);
  if (error) {
    return new Response(JSON.stringify({ error }), {
      status: 500,
      headers: ANSWEAR_HEADER,
    });
  }

  return new Response("ok", { status: 200, headers: ANSWEAR_HEADER });
});
