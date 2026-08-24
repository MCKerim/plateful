import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, X } from "lucide-react";
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
 * What happened, keyed on the worker's `error_code` (mirrors the iOS
 * ImportFailureSheet copy). The raw `error` text is deliberately not shown —
 * it's untranslated and doesn't help the user decide what to do next.
 */
function failureMessageKey(recipeImport: RecipeImportPlaceholder): string {
  if (recipeImport.errorCode === "source_unavailable")
    return "cookbook.importFailedSourceUnavailable";
  if (recipeImport.errorCode === "unreachable") return "cookbook.importFailedUnreachable";
  // A page that was read fine but held no recipe (a homepage, an article);
  // for photo/text sources `no_recipe` reads better as the per-source line.
  if (recipeImport.errorCode === "no_recipe" && recipeImport.sourceType === "url")
    return "cookbook.importFailedNoRecipePage";
  switch (recipeImport.sourceType) {
    case "image":
      return "cookbook.importFailedPhotos";
    case "text":
      return "cookbook.importFailedText";
    default:
      return "cookbook.importFailedLink";
  }
}

/**
 * Cookbook placeholder for an in-flight or failed import (`recipe_imports` row).
 * Importing shows a skeleton; failed explains what happened (via `error_code`)
 * and offers Dismiss (deletes the row). No Retry: the worker never retries and
 * a re-run of the same source provably never succeeds — re-sharing the source
 * IS the retry.
 */
export default function ImportCard({ recipeImport }: Readonly<Props>) {
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  const dismissMutation = useMutation({
    mutationFn: () => recipeImportApi.dismiss(supabase, recipeImport.id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.recipeImports.all }),
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
        <div className="flex items-start justify-between gap-1">
          <span className="text-xs font-semibold text-destructive">
            {t("cookbook.importFailed")}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1 -mt-1 -mr-1 shrink-0"
            aria-label={t("cookbook.dismiss")}
            onClick={() => dismissMutation.mutate()}
            disabled={dismissMutation.isPending}
          >
            <X className="!size-4" />
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">
          {t(failureMessageKey(recipeImport))}
        </span>
      </div>
    </Card>
  );
}
