import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Client for the insert-based recipe-import pipeline (the same one iOS uses).
 * Starting an import just inserts a `recipe_imports` placeholder row (and, for
 * photos, stages the images first). A Postgres webhook then nudges the backend
 * worker, which extracts the recipe(s) in the background and writes them back —
 * one source can yield several recipes. The library shows the placeholder and
 * fills it in live via Realtime.
 */
export const recipeImportApi = {
  /**
   * Starts a URL import. `status` defaults to `importing` and `created_by` to
   * `auth.uid()` server-side; RLS requires the household. Returns immediately.
   */
  async createUrlImport(
    supabase: SupabaseClient,
    params: { url: string; householdId: string; language: string }
  ): Promise<void> {
    const { error } = await supabase.from("recipe_imports").insert({
      household_id: params.householdId,
      source_type: "url",
      source_url: params.url,
      language: params.language,
    });
    if (error) throw error;
  },

  /**
   * Starts an image import: uploads the (already compressed) photos to the
   * private `import-staging` bucket under the household's folder, then inserts a
   * `recipe_imports` row whose `source_refs` are those storage paths. The worker
   * downloads them, extracts, and deletes the staged files. The path's first
   * segment is the household id, which the staging-bucket RLS checks.
   */
  async createImageImport(
    supabase: SupabaseClient,
    params: { files: File[]; householdId: string; language: string }
  ): Promise<void> {
    const batch = crypto.randomUUID();
    const folder = `${params.householdId}/${batch}`;
    const paths: string[] = [];

    for (let index = 0; index < params.files.length; index++) {
      const path = `${folder}/${index}.jpg`;
      const { error } = await supabase.storage
        .from("import-staging")
        .upload(path, params.files[index], {
          contentType: "image/jpeg",
          upsert: false,
        });
      if (error) throw error;
      paths.push(path);
    }

    const { error } = await supabase.from("recipe_imports").insert({
      household_id: params.householdId,
      source_type: "image",
      source_refs: paths,
      language: params.language,
    });
    if (error) throw error;
  },

  /**
   * Re-runs a failed import via the `retry_import` RPC (flips it back to
   * `importing` server-side). The client can't UPDATE `recipe_imports` directly
   * — that's revoked — so retry must go through the RPC.
   */
  async retry(supabase: SupabaseClient, importId: string): Promise<void> {
    const { error } = await supabase.rpc("retry_import", { p_import_id: importId });
    if (error) throw error;
  },

  /**
   * Dismisses an import placeholder by deleting its row. Any recipes it already
   * produced are untouched (`recipes.import_id` is `ON DELETE SET NULL`).
   */
  async dismiss(supabase: SupabaseClient, importId: string): Promise<void> {
    const { error } = await supabase.from("recipe_imports").delete().eq("id", importId);
    if (error) throw error;
  },
};
