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

const INACTIVE_EVENTS = new Set([
  "CANCELLATION",
  "EXPIRATION",
  "BILLING_ISSUE",
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

  const rcUserId: string = event.app_user_id;
  const eventType: string = event.type;

  const isActive = ACTIVE_EVENTS.has(eventType);
  const isInactive = INACTIVE_EVENTS.has(eventType);

  if (!isActive && !isInactive) {
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
