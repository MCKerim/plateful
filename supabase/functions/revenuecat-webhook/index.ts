import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { CORS, ANSWEAR_HEADER } from "../_shared/headers.ts";

const ACTIVE_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "UNCANCELLATION",
  "TRIAL_STARTED",
  "TRIAL_CONVERTED",
]);

// CANCELLATION is deliberately NOT here: it fires the moment auto-renew is
// switched off, while the customer keeps their paid access until the period
// ends — EXPIRATION is what actually revokes.
const INACTIVE_EVENTS = new Set([
  "EXPIRATION",
  "BILLING_ISSUE",
  "SUBSCRIPTION_PAUSED",
]);

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

  const isActive = ACTIVE_EVENTS.has(eventType);
  const isInactive = INACTIVE_EVENTS.has(eventType);

  if (!isActive && !isInactive) {
    return new Response("ok", { status: 200, headers: ANSWEAR_HEADER });
  }

  // The event's app_user_id can be an anonymous alias ("$RCAnonymousID:…")
  // when the store attributed the purchase before/outside a logIn — the
  // Supabase user id is then still present among the aliases. Pick the
  // first id that is a UUID; without one we can't map to a user.
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const candidates: string[] = [
    event.app_user_id,
    event.original_app_user_id,
    ...(Array.isArray(event.aliases) ? event.aliases : []),
  ];
  const rcUserId = candidates.find((id) => typeof id === "string" && UUID_RE.test(id));

  console.log(
    `event=${eventType} app_user_id=${event.app_user_id} resolved_user=${rcUserId ?? "none"}`
  );

  if (!rcUserId) {
    // No mappable user (e.g. a purely anonymous customer) — nothing to do.
    return new Response("ok", { status: 200, headers: ANSWEAR_HEADER });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Look up the user's household
  const { data: userData } = await supabase
    .from("users")
    .select("id, household_id")
    .eq("id", rcUserId)
    .single();

  if (!userData?.household_id) {
    // User has no household — nothing to update
    return new Response("ok", { status: 200, headers: ANSWEAR_HEADER });
  }

  const { error } = await supabase
    .from("household_subscriptions")
    .upsert(
      {
        household_id: userData.household_id,
        payer_user_id: userData.id,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "household_id" }
    );

  if (error) {
    console.error("Error upserting household subscription:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: ANSWEAR_HEADER,
    });
  }

  return new Response("ok", { status: 200, headers: ANSWEAR_HEADER });
});
