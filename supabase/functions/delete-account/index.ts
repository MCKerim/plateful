import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.3";
import { ANSWEAR_HEADER, CORS } from "../_shared/headers.ts";
import {
  AccountDeletionConfiguration,
  AccountDeletionStatus,
  processAccountDeletionJob,
} from "../_shared/account-deletion.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 4_096;

interface RequestBody {
  operation?: "request" | "status" | "drain";
  request_id?: string;
  successor_user_id?: string | null;
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...ANSWEAR_HEADER, "Cache-Control": "no-store" },
  });
}

function configuration(): AccountDeletionConfiguration {
  const postHogHost = Deno.env.get("POSTHOG_HOST");
  const postHogProjectID = Deno.env.get("POSTHOG_PROJECT_ID");
  const postHogPersonalAPIKey = Deno.env.get("POSTHOG_PERSONAL_API_KEY");
  const revenueCatProjectID = Deno.env.get("REVENUECAT_PROJECT_ID");
  const revenueCatSecretAPIKey = Deno.env.get("REVENUECAT_V2_SECRET_KEY");
  return {
    postHog:
      postHogHost && postHogProjectID && postHogPersonalAPIKey
        ? {
            host: postHogHost,
            projectID: postHogProjectID,
            personalAPIKey: postHogPersonalAPIKey,
          }
        : null,
    revenueCat:
      revenueCatProjectID && revenueCatSecretAPIKey
        ? {
            projectID: revenueCatProjectID,
            secretAPIKey: revenueCatSecretAPIKey,
          }
        : null,
  };
}

async function body(req: Request): Promise<RequestBody | null> {
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) return null;
  try {
    const text = await req.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return null;
    const value = JSON.parse(text) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return value as RequestBody;
  } catch {
    return null;
  }
}

function validRequest(value: RequestBody): boolean {
  return (
    typeof value.request_id === "string" &&
    UUID_RE.test(value.request_id) &&
    (value.successor_user_id === undefined ||
      value.successor_user_id === null ||
      (typeof value.successor_user_id === "string" && UUID_RE.test(value.successor_user_id)))
  );
}

function responseForStatus(status: AccountDeletionStatus): Response {
  return json(
    status as unknown as Record<string, unknown>,
    status.status === "completed" ? 200 : 202
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ code: "method_not_allowed" }, 405);

  const requestBody = await body(req);
  if (!requestBody) return json({ code: "invalid_request" }, 400);

  const supabaseURL = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseURL || !anonKey || !serviceRoleKey) {
    console.error("delete-account: Supabase environment is incomplete");
    return json({ code: "service_unavailable" }, 503);
  }

  const admin = createClient(supabaseURL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const workerToken = Deno.env.get("ACCOUNT_DELETION_WORKER_TOKEN");
  const isWorker =
    requestBody.operation === "drain" &&
    Boolean(workerToken) &&
    req.headers.get("x-account-deletion-worker") === workerToken;

  if (requestBody.operation === "drain") {
    if (!isWorker) return json({ code: "unauthorized" }, 401);
    let processed = 0;
    try {
      for (let index = 0; index < 3; index += 1) {
        const result = await processAccountDeletionJob(admin, configuration(), null);
        if (!result) break;
        processed += 1;
      }
      return json({ processed });
    } catch (error) {
      console.error("delete-account: worker drain failed", error);
      return json({ code: "worker_unavailable" }, 503);
    }
  }

  const authorization = req.headers.get("authorization");
  if (!authorization) return json({ code: "unauthorized" }, 401);
  const userClient = createClient(supabaseURL, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) return json({ code: "unauthorized" }, 401);

  if (requestBody.operation === "status") {
    if (!validRequest(requestBody)) return json({ code: "invalid_request" }, 400);
    const { data, error } = await userClient.rpc("get_my_account_deletion_status", {
      p_request_id: requestBody.request_id,
    });
    if (error) {
      console.error("delete-account: status lookup failed", error);
      return json({ code: "status_unavailable" }, 503);
    }
    if (!data || data.status == null) {
      return json({ code: "request_not_found" }, 404);
    }
    try {
      const status = await processAccountDeletionJob(
        admin,
        configuration(),
        requestBody.request_id ?? null
      );
      return responseForStatus(status ?? (data as AccountDeletionStatus));
    } catch (error) {
      console.error("delete-account: status advance failed", error);
      return responseForStatus(data as AccountDeletionStatus);
    }
  }

  if (!validRequest(requestBody)) return json({ code: "invalid_request" }, 400);
  const { data: requested, error: requestError } = await userClient.rpc(
    "request_account_deletion",
    {
      p_request_id: requestBody.request_id,
      p_successor_user_id: requestBody.successor_user_id ?? null,
    }
  );
  if (requestError) {
    console.error("delete-account: preparation failed", requestError);
    return json({ code: "preparation_failed" }, 503);
  }
  if (!requested?.accepted) {
    return json(
      {
        code: typeof requested?.code === "string" ? requested.code : "request_rejected",
      },
      409
    );
  }

  try {
    const status = await processAccountDeletionJob(admin, configuration(), requested.request_id);
    return responseForStatus(
      status ?? {
        request_id: requested.request_id,
        status: requested.status,
        retry_after_seconds: requested.retry_after_seconds,
      }
    );
  } catch (error) {
    // Preparation is already durable. Report processing, never a false failure
    // that could lead the user to submit a second destructive request.
    console.error("delete-account: immediate worker advance failed", error);
    return json(
      {
        request_id: requested.request_id,
        status: "processing",
        retry_after_seconds: 30,
      },
      202
    );
  }
});
