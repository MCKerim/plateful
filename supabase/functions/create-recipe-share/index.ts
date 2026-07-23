import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { ANSWEAR_HEADER, CORS } from "../_shared/headers.ts";

const BUCKET = "recipeimages";
const MAX_REQUEST_BYTES = 1_000_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

interface CreateShareRequest {
  recipe_id: string;
  snapshot: Record<string, unknown>;
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...ANSWEAR_HEADER, "Cache-Control": "no-store" },
  });
}

function validSnapshot(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const snapshot = value as Record<string, unknown>;
  if (
    typeof snapshot.name !== "string" ||
    snapshot.name.trim().length === 0 ||
    snapshot.name.length > 500
  ) {
    return false;
  }

  if (
    snapshot.instructions != null &&
    (typeof snapshot.instructions !== "string" || snapshot.instructions.length > 200_000)
  ) {
    return false;
  }

  if (!Array.isArray(snapshot.ingredients) || snapshot.ingredients.length > 500) {
    return false;
  }

  if (
    snapshot.instruction_steps != null &&
    (!Array.isArray(snapshot.instruction_steps) || snapshot.instruction_steps.length > 500)
  ) {
    return false;
  }

  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }
  if (req.method !== "POST") {
    return json({ error: "Only POST is allowed" }, 405);
  }

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return json({ error: "Share snapshot is too large" }, 413);
  }

  const authorization = req.headers.get("authorization");
  if (!authorization) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: CreateShareRequest;
  try {
    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
      return json({ error: "Share snapshot is too large" }, 413);
    }
    body = JSON.parse(rawBody) as CreateShareRequest;
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!UUID_RE.test(body.recipe_id ?? "") || !validSnapshot(body.snapshot)) {
    return json({ error: "Invalid recipe share" }, 400);
  }
  const recipeId = body.recipe_id.toLowerCase();

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("create-recipe-share: Supabase environment is incomplete");
    return json({ error: "Share service is unavailable" }, 500);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return json({ error: "Unauthorized" }, 401);
  }

  // The user-scoped client is intentional: recipe RLS is the household
  // authorization boundary. A missing row and a foreign-household row are
  // indistinguishable to the caller.
  const { data: recipe, error: recipeError } = await userClient
    .from("recipes")
    .select("id, image_path")
    .eq("id", recipeId)
    .maybeSingle();
  if (recipeError) {
    console.error("create-recipe-share: recipe lookup failed", recipeError);
    return json({ error: "Could not create the share" }, 500);
  }
  if (!recipe) {
    return json({ error: "Recipe not found" }, 404);
  }

  const shareId = crypto.randomUUID();
  const imageFolder = `shared_${shareId}`;
  let copiedImagePath: string | undefined;
  let imageUrls: string[] = [];

  if (recipe.image_path) {
    const expectedPrefix = `recipe_${recipeId}/`;
    const sourcePath = String(recipe.image_path);
    const extension = sourcePath.split(".").pop()?.toLowerCase();
    if (!sourcePath.startsWith(expectedPrefix) || !extension || !IMAGE_EXTENSIONS.has(extension)) {
      console.error("create-recipe-share: recipe has an invalid image path");
      return json({ error: "Recipe photo could not be shared" }, 409);
    }

    copiedImagePath = `${imageFolder}/${crypto.randomUUID()}.${extension}`;
    const { error: copyError } = await serviceClient.storage
      .from(BUCKET)
      .copy(sourcePath, copiedImagePath);
    if (copyError) {
      console.error("create-recipe-share: image copy failed", copyError);
      return json({ error: "Recipe photo could not be copied" }, 502);
    }

    imageUrls = [serviceClient.storage.from(BUCKET).getPublicUrl(copiedImagePath).data.publicUrl];
  }

  const snapshot = {
    ...body.snapshot,
    image_urls: imageUrls,
    image_folder: imageFolder,
  };

  // The service role writes only after the caller and authoritative recipe
  // access were verified above. This lets the final database cutover remove
  // direct client INSERT access to shared_recipes entirely.
  const { data: share, error: insertError } = await serviceClient
    .from("shared_recipes")
    .insert({
      id: shareId,
      snapshot,
      created_by: user.id,
    })
    .select("token")
    .single();

  if (insertError || !share) {
    console.error("create-recipe-share: share insert failed", insertError);
    if (copiedImagePath) {
      const { error: cleanupError } = await serviceClient.storage
        .from(BUCKET)
        .remove([copiedImagePath]);
      if (cleanupError) {
        console.error("create-recipe-share: compensating image cleanup failed", cleanupError);
      }
    }
    return json({ error: "Could not create the share" }, 500);
  }

  return json({ token: share.token });
});
