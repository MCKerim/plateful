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
  createdAt: string;
};
