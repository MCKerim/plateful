export type RecipeImportStatus = "importing" | "failed";

/**
 * An in-flight or failed import placeholder shown in the cookbook. Resolved
 * imports (status `ready`) are not surfaced — their recipes show instead.
 */
export type RecipeImportPlaceholder = {
  id: string;
  sourceType: string;
  sourceUrl: string | null;
  status: RecipeImportStatus;
  error: string | null;
  /**
   * Machine-readable failure code written by the worker (contract in the iOS
   * repo's docs/system-architecture.md): `source_unavailable`, `unreachable`,
   * `no_recipe`, or null/unknown. The client keys its failure copy off this;
   * `error` stays raw free text for humans reading the row.
   */
  errorCode: string | null;
  createdAt: string;
};
