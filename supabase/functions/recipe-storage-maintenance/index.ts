import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const BUCKET = "recipeimages";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

interface CleanupJob {
  id: number;
  bucket_id: string;
  object_path: string;
  is_prefix: boolean;
  attempt_count: number;
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

async function removePrefix(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  prefix: string
): Promise<number> {
  let removed = 0;

  // Removing each page changes the next page, so always request offset zero.
  // SEC-003 paths are exactly one folder deep; nested folders are rejected.
  for (let page = 0; page < 100; page += 1) {
    const { data: entries, error: listError } = await supabase.storage.from(bucket).list(prefix, {
      limit: 100,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });
    if (listError) throw listError;

    const nestedFolder = (entries ?? []).find((entry) => entry.id == null);
    if (nestedFolder) {
      throw new Error("cleanup prefix contains an unexpected nested folder");
    }

    const paths = (entries ?? []).map((entry) => `${prefix}/${entry.name}`);
    if (paths.length === 0) return removed;

    const { error: removeError } = await supabase.storage.from(bucket).remove(paths);
    if (removeError) throw removeError;
    removed += paths.length;
  }

  throw new Error("cleanup prefix exceeded the 10,000-object safety limit");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "Only POST is allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("recipe-storage-maintenance: Supabase environment is incomplete");
    return json({ error: "Maintenance service is unavailable" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const candidateSecret = req.headers.get("x-recipe-storage-secret");
  const { data: authorized, error: authorizationError } = await supabase.rpc(
    "recipe_storage_maintenance_secret_matches",
    { p_candidate: candidateSecret ?? "" }
  );
  if (authorizationError) {
    console.error("recipe-storage-maintenance: secret validation failed", authorizationError);
    return json({ error: "Maintenance service is unavailable" }, 500);
  }
  if (authorized !== true) {
    return json({ error: "Unauthorized" }, 401);
  }

  let mode: "cleanup" | "configure";
  try {
    const body = (await req.json()) as { mode?: unknown };
    mode = body.mode === "configure" ? "configure" : "cleanup";
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (mode === "configure") {
    const { error } = await supabase.storage.updateBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
      fileSizeLimit: MAX_FILE_SIZE_BYTES,
    });
    if (error) {
      console.error("recipe-storage-maintenance: bucket configuration failed", error);
      return json({ error: "Bucket configuration failed" }, 500);
    }
    return json({ configured: true });
  }

  const { data, error: claimError } = await supabase.rpc("claim_recipe_image_cleanup_jobs", {
    p_limit: 25,
  });
  if (claimError) {
    console.error("recipe-storage-maintenance: claiming jobs failed", claimError);
    return json({ error: "Could not claim cleanup jobs" }, 500);
  }

  const jobs = (data ?? []) as CleanupJob[];
  let completed = 0;
  let failed = 0;
  let removedObjects = 0;

  for (const job of jobs) {
    let succeeded = false;
    let failure: string | undefined;

    try {
      if (job.bucket_id !== BUCKET) {
        throw new Error("cleanup job targets an unsupported bucket");
      }
      if (!job.object_path || job.object_path.startsWith("/") || job.object_path.includes("..")) {
        throw new Error("cleanup job has an invalid object path");
      }

      if (job.is_prefix) {
        removedObjects += await removePrefix(
          supabase,
          job.bucket_id,
          job.object_path.replace(/\/+$/, "")
        );
      } else {
        const { error: removeError } = await supabase.storage
          .from(job.bucket_id)
          .remove([job.object_path]);
        if (removeError) throw removeError;
        removedObjects += 1;
      }
      succeeded = true;
      completed += 1;
    } catch (error) {
      failed += 1;
      failure = error instanceof Error ? error.message : String(error);
      console.error(`recipe-storage-maintenance: cleanup job ${job.id} failed`, failure);
    }

    const { error: completionError } = await supabase.rpc("complete_recipe_image_cleanup_job", {
      p_job_id: job.id,
      p_succeeded: succeeded,
      p_error: failure ?? null,
    });
    if (completionError) {
      console.error(`recipe-storage-maintenance: completing job ${job.id} failed`, completionError);
    }
  }

  return json({
    claimed: jobs.length,
    completed,
    failed,
    removed_objects: removedObjects,
  });
});
