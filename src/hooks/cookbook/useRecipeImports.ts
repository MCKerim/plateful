import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import {
  RecipeImportPlaceholder,
  RecipeImportStatus,
} from "@/types/recipeImport.types";

/**
 * The household's in-flight / failed import placeholders (RLS scopes to the
 * household). These render as cards in the cookbook until the backend worker
 * resolves them into real recipes. Realtime (see App.tsx) is the primary
 * refresh signal; the short poll here is a backstop while something is
 * importing in case the socket drops.
 */
export function useRecipeImports() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();
  const previousActiveIds = useRef<Set<string>>(new Set());

  const query = useQuery({
    queryKey: queryKeys.recipeImports.active,
    queryFn: async (): Promise<RecipeImportPlaceholder[]> => {
      const { data, error } = await supabase
        .from("recipe_imports")
        .select("id, source_type, source_url, status, error, created_at")
        .in("status", ["importing", "failed"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        sourceType: row.source_type,
        sourceUrl: row.source_url,
        status: row.status as RecipeImportStatus,
        error: row.error,
        createdAt: row.created_at,
      }));
    },
    staleTime: 1000 * 30,
    refetchInterval: (q) => {
      const hasImporting = q.state.data?.some((i) => i.status === "importing");
      return hasImporting ? 5000 : false;
    },
  });

  // When an import that was importing leaves the active list, it resolved into
  // recipe(s) — refetch the library so they appear (backstop for Realtime).
  useEffect(() => {
    const current = query.data;
    if (!current) return;

    const currentIds = new Set(current.map((i) => i.id));
    const resolved = [...previousActiveIds.current].filter((id) => !currentIds.has(id));
    if (resolved.length > 0) {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all });
    }
    previousActiveIds.current = new Set(current.filter((i) => i.status === "importing").map((i) => i.id));
  }, [query.data, queryClient]);

  return query;
}
