import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSupabase } from "@/utils/supabase";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { readClipboardText } from "@/utils/nativeClipboard";
import { useIncrementMission } from "@/hooks/missions/useIncrementMission";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { recipeImportApi } from "@/api/recipeImport.api";

/**
 * Cleans a user-typed link into an absolute URL, or returns null if it isn't a
 * plausible one yet. Prepends `https://` when the scheme is missing and requires
 * a dotted host. Mirrors the iOS URL import's `normalizedURL`.
 */
function normalizeUrl(raw: string): string | null {
  let text = raw.trim();
  if (text === "") return null;
  const lower = text.toLowerCase();
  if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
    text = "https://" + text;
  }
  try {
    const url = new URL(text);
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export default function URLImport() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [urlInput, setUrlInput] = useState("");
  const { supabase } = useSupabase();
  const householdId = useAppSelector(selectHouseholdId);
  const [isSaving, setIsSaving] = useState(false);
  // The placeholder was created; we show a brief confirmation then leave.
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();
  const incrementMission = useIncrementMission();

  const [searchParams, setSearchParams] = useSearchParams();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoImportUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const handleSave = useCallback(
    async (rawUrl: string) => {
      const url = normalizeUrl(rawUrl);
      if (!url) {
        toast.error(t("urlImport.errors.invalidUrl"));
        return;
      }
      if (!householdId) {
        toast.error(t("urlImport.errors.importFailed"));
        return;
      }

      setIsSaving(true);
      try {
        await recipeImportApi.createUrlImport(supabase, {
          url,
          householdId,
          language: i18n.language.split("-")[0],
        });

        incrementMission.mutate({ missionId: "import_recipes" });
        await queryClient.invalidateQueries({ queryKey: queryKeys.recipeImports.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all });

        setSubmitted(true);
        toast.success(t("urlImport.importStarted"));

        // Fire-and-forget: the worker extracts in the background. Show the
        // confirmation briefly, then drop the user into their cookbook where the
        // placeholder card is already waiting.
        redirectTimerRef.current = setTimeout(() => navigate("/cookbook"), 1600);
      } catch (err) {
        console.error("Failed to start URL import:", err);
        toast.error(t("urlImport.errors.importFailed"));
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, householdId, i18n.language, incrementMission, queryClient, navigate, t]
  );

  useEffect(() => {
    const urlFromParams = searchParams.get("url");
    if (urlFromParams) {
      // A share can cold-start the app before the household is restored. Keep
      // the URL in the route until that state is ready, then import it once.
      if (!householdId || autoImportUrlRef.current === urlFromParams) return;

      autoImportUrlRef.current = urlFromParams;
      setSearchParams({}, { replace: true });
      setUrlInput(urlFromParams);
      handleSave(urlFromParams);
      return;
    }

    // Only paste from clipboard when no auto-import was just triggered
    const abortController = new AbortController();

    async function autoPasteFromClipboard() {
      try {
        const text = await readClipboardText();
        if (abortController.signal.aborted) return;
        if (text.startsWith("http://") || text.startsWith("https://")) {
          setUrlInput(text);
          toast.success(t("urlImport.linkPastedFromClipboard"));
        }
      } catch (err) {
        console.debug("Could not access clipboard or invalid content.", err);
      }
    }

    autoPasteFromClipboard();
    return () => {
      abortController.abort();
    };
  }, [searchParams, setSearchParams, handleSave, householdId, t]);

  const busy = isSaving || submitted;

  const saveFooter = (
    <>
      <div className="h-safe-b-[100px]"></div>

      <div className="fixed bottom-0 w-full max-w-lg bg-background z-20 p-4 pb-safe-4 flex gap-2 border-border border-t-[1px]">
        {busy ? (
          <Button className="w-full" variant="secondary" onClick={() => navigate("/cookbook")}>
            {t("urlImport.backToCookbook")}
          </Button>
        ) : (
          <Button className="w-full" variant="accent" onClick={() => handleSave(urlInput)}>
            {t("urlImport.importButton")}
          </Button>
        )}
      </div>
    </>
  );

  return (
    <Layout showHeader={false} showFooter={false} footer={saveFooter}>
      <div className="flex justify-between w-full items-center">
        <h1 className="text-2xl font-bold first-font">{t("urlImport.title")}</h1>
      </div>

      <div className="flex items-center flex-1">
        {!busy && (
          <Field>
            <FieldLabel htmlFor="url">{t("urlImport.urlFieldLabel")}</FieldLabel>

            <FieldDescription>{t("urlImport.urlFieldDescription")}</FieldDescription>

            <Input
              id="url"
              type="text"
              placeholder={t("urlImport.urlFieldPlaceholder")}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave(urlInput);
                }
              }}
            />
          </Field>
        )}

        {busy && (
          <div className="flex flex-col items-center justify-center w-full gap-6 text-center">
            <CheckCircle2 className="text-primary size-16" />

            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold second-font">{t("urlImport.startedTitle")}</h2>
              <p className="second-font text-muted-foreground">
                {t("urlImport.startedDescription")}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
