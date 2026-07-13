import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// The one place pushes leave the backend: looks up the target users' device
// tokens in `push_tokens` and delivers via APNs. Callers are server-side only
// (Postgres triggers through pg_net — the import-finished trigger is the
// first), authenticated by the `x-push-secret` header against the PUSH_SECRET
// env var; the same value lives in Vault for the triggers.
//
// Notification *content* is String Catalog keys (`title-loc-key` / `loc-key`
// + args), resolved on-device by the iOS app — this function stays
// language-agnostic. `data` rides along in the payload root for client-side
// routing (e.g. `type`, `import_id`).
//
// Android later: add an FCM branch on `push_tokens.platform`.

interface Notification {
  title_loc_key: string;
  title_loc_args?: string[];
  loc_key: string;
  loc_args?: string[];
  thread_id?: string;
  data?: Record<string, string>;
}

interface SendRequest {
  user_ids: string[];
  notification: Notification;
}

interface TokenRow {
  token: string;
  platform: string;
  environment: string;
}

const APNS_TOPIC = Deno.env.get("APNS_TOPIC") ?? "com.kblanks.plateful";

/** APNs provider JWTs must be reused between 20 and 60 minutes; cache in
 * module scope and re-sign after 50. */
let cachedJwt: { token: string; issuedAt: number } | undefined;

async function apnsJwt(): Promise<string> {
  const now = Date.now();
  if (cachedJwt && now - cachedJwt.issuedAt < 50 * 60 * 1000) {
    return cachedJwt.token;
  }

  const keyId = Deno.env.get("APNS_KEY_ID");
  const teamId = Deno.env.get("APNS_TEAM_ID");
  // The .p8 as-is; tolerate literal "\n" from dashboard-pasted secrets.
  const pem = Deno.env.get("APNS_P8")?.replace(/\\n/g, "\n");
  if (!keyId || !teamId || !pem) {
    throw new Error("APNS_KEY_ID / APNS_TEAM_ID / APNS_P8 not configured");
  }

  const der = Uint8Array.from(
    atob(pem.replace(/-----[A-Z ]+-----/g, "").replace(/\s/g, "")),
    (c) => c.charCodeAt(0)
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const base64url = (bytes: Uint8Array) =>
    btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  const encode = (obj: unknown) =>
    base64url(new TextEncoder().encode(JSON.stringify(obj)));

  const signingInput = `${encode({ alg: "ES256", kid: keyId })}.${encode({
    iss: teamId,
    iat: Math.floor(now / 1000),
  })}`;
  // WebCrypto ECDSA signatures are already raw r||s — exactly JOSE's format.
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput)
  );

  const token = `${signingInput}.${base64url(new Uint8Array(signature))}`;
  cachedJwt = { token, issuedAt: now };
  return token;
}

/** Delivers to one device. Returns whether the token is dead and should be
 * pruned (uninstalled app, stale token, token from the other environment). */
async function deliver(
  row: TokenRow,
  notification: Notification,
  jwt: string
): Promise<{ ok: boolean; prune: boolean; reason?: string }> {
  const host =
    row.environment === "sandbox"
      ? "https://api.sandbox.push.apple.com"
      : "https://api.push.apple.com";

  const alert: Record<string, unknown> = {
    "title-loc-key": notification.title_loc_key,
    "loc-key": notification.loc_key,
  };
  if (notification.title_loc_args?.length) {
    alert["title-loc-args"] = notification.title_loc_args;
  }
  if (notification.loc_args?.length) alert["loc-args"] = notification.loc_args;

  const aps: Record<string, unknown> = { alert, sound: "default" };
  if (notification.thread_id) aps["thread-id"] = notification.thread_id;

  const response = await fetch(`${host}/3/device/${row.token}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${jwt}`,
      "apns-topic": APNS_TOPIC,
      "apns-push-type": "alert",
      "apns-priority": "10",
    },
    body: JSON.stringify({ aps, ...(notification.data ?? {}) }),
  });

  if (response.ok) return { ok: true, prune: false };

  const body = await response.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason : "unknown";
  // 410 = Unregistered (app deleted). BadDeviceToken also covers a token sent
  // to the wrong environment host — the row's environment is wrong, prune it.
  const prune =
    response.status === 410 ||
    reason === "BadDeviceToken" ||
    reason === "DeviceTokenNotForTopic";
  return { ok: false, prune, reason: `${response.status} ${reason}` };
}

Deno.serve(async (req: Request) => {
  const expected = Deno.env.get("PUSH_SECRET");
  if (!expected || req.headers.get("x-push-secret") !== expected) {
    return new Response("unauthorized", { status: 401 });
  }

  let body: SendRequest;
  try {
    body = await req.json();
  } catch {
    return new Response("invalid json", { status: 400 });
  }
  const userIds = (body.user_ids ?? []).filter((id) => typeof id === "string");
  const notification = body.notification;
  if (!userIds.length || !notification?.loc_key || !notification?.title_loc_key) {
    return new Response("user_ids and notification loc keys are required", {
      status: 400,
    });
  }

  // Service role: push_tokens is owner-RLS'd, this function reads across users.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: rows, error } = await supabase
    .from("push_tokens")
    .select("token, platform, environment")
    .in("user_id", userIds);
  if (error) {
    console.error("send-push: token lookup failed", error);
    return new Response("token lookup failed", { status: 500 });
  }

  const iosRows = (rows ?? []).filter((r: TokenRow) => r.platform === "ios");
  if (!iosRows.length) {
    return Response.json({ sent: 0, failed: 0, pruned: 0 });
  }

  const jwt = await apnsJwt();
  const results = await Promise.all(
    iosRows.map(async (row: TokenRow) => {
      try {
        return { row, ...(await deliver(row, notification, jwt)) };
      } catch (e) {
        return { row, ok: false, prune: false, reason: String(e) };
      }
    })
  );

  const dead = results.filter((r) => r.prune).map((r) => r.row.token);
  if (dead.length) {
    await supabase.from("push_tokens").delete().in("token", dead);
  }

  const failed = results.filter((r) => !r.ok);
  for (const f of failed) {
    console.error(`send-push: delivery failed (${f.reason})`);
  }

  return Response.json({
    sent: results.length - failed.length,
    failed: failed.length,
    pruned: dead.length,
  });
});
