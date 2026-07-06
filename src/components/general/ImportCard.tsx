import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, RotateCw, X, Loader2 } from "lucide-react";
import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { recipeImportApi } from "@/api/recipeImport.api";
import { RecipeImportPlaceholder } from "@/types/recipeImport.types";

type Props = {
  recipeImport: RecipeImportPlaceholder;
};

function hostFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Cookbook placeholder for an in-flight or failed import (`recipe_imports` row).
 * Importing shows a skeleton; failed offers Retry (via the `retry_import` RPC)
 * and Dismiss (deletes the row).
 */
export default function ImportCard({ recipeImport }: Readonly<Props>) {
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.recipeImports.all });

  const retryMutation = useMutation({
    mutationFn: () => recipeImportApi.retry(supabase, recipeImport.id),
    onSettled: invalidate,
  });

  const dismissMutation = useMutation({
    mutationFn: () => recipeImportApi.dismiss(supabase, recipeImport.id),
    onSettled: invalidate,
  });

  if (recipeImport.status === "importing") {
    const host = hostFromUrl(recipeImport.sourceUrl);
    return (
      <Card className="relative bg-transparent border-2">
        <Skeleton className="w-full h-32 rounded-b-none" />

        <div className="flex flex-col justify-between gap-2 p-2">
          <span className="text-xs text-muted-foreground">{t("cookbook.importing")}</span>
          {host ? (
            <span className="text-xs font-medium truncate">{host}</span>
          ) : (
            <Skeleton className="h-4 w-3/4" />
          )}
          <Skeleton className="h-3 w-1/2" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative bg-transparent border-2 border-destructive/40">
      <div className="flex items-center justify-center w-full h-32 bg-destructive/5">
        <AlertTriangle className="text-destructive/70 size-8" />
      </div>

      <div className="flex flex-col gap-2 p-2">
        <span className="text-xs font-semibold text-destructive">{t("cookbook.importFailed")}</span>

        <div className="flex gap-1">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 h-8 px-2"
            onClick={() => retryMutation.mutate()}
            disabled={retryMutation.isPending || dismissMutation.isPending}
          >
            {retryMutation.isPending ? (
              <Loader2 className="animate-spin !size-4" />
            ) : (
              <RotateCw className="!size-4" />
            )}
            <span className="text-xs">{t("cookbook.retry")}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            aria-label={t("cookbook.dismiss")}
            onClick={() => dismissMutation.mutate()}
            disabled={retryMutation.isPending || dismissMutation.isPending}
          >
            <X className="!size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
