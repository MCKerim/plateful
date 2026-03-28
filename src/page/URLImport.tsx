import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/utils/supabase";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/components/general/LoadingDots";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router";
import RecipeCard from "@/components/general/RecipeCard";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { readClipboardText } from "@/utils/nativeClipboard";
import { useIncrementMission } from "@/hooks/missions/useIncrementMission";

const IMPORTED_URL_KEY = "lastAutoImportedUrl";

function wasUrlAlreadyAutoImported(url: string): boolean {
  try {
    return localStorage.getItem(IMPORTED_URL_KEY) === url;
  } catch {
    return false;
  }
}

function markUrlAsAutoImported(url: string): void {
  try {
    localStorage.setItem(IMPORTED_URL_KEY, url);
  } catch {
    // ignore storage errors
  }
}

export default function URLImport() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [urlInput, setUrlInput] = useState("");
  const { supabase } = useSupabase();
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<{ id: string; name: string } | null>(null);
  const queryClient = useQueryClient();
  const incrementMission = useIncrementMission();

  const [searchParams] = useSearchParams();

  const handleSave = useCallback(
    async (url: string, signal?: AbortSignal) => {
      if (!url?.trim()) return;

      setIsSaving(true);

      // Invalidate cache immediately so Cookbook shows the importing card
      await queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all });

      try {
        const { data, error } = await supabase.functions.invoke("recipe-from-url", {
          body: {
            url: url.trim(),
          },
        });

        // Check if component unmounted during the async operation
        if (signal?.aborted) return;

        if (error) {
          console.error("Edge function returned error:", error);
          toast.error(t("urlImport.errors.importFailed"));
        } else {
          setData(data[0]);
          incrementMission.mutate({ missionId: "import_recipes" });
          await queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all });
          navigate("/cookbook", { replace: true });
          toast.success(t("urlImport.success"), {
            action: {
              label: t("urlImport.viewRecipe"),
              onClick: () => {
                navigate(`/recipe/${data[0].id}`);
              },
            },
          });
        }
      } catch (err: unknown) {
        if (signal?.aborted) return;
        console.error("Unexpected error calling recipe-from-url:", err);
        toast.error(t("urlImport.errors.importFailed"));

        try {
          const errWithResponse = err as { response?: { text?: () => Promise<string> } };
          if (errWithResponse?.response && typeof errWithResponse.response.text === "function") {
            const text = await errWithResponse.response.text();
            console.error("Edge function returned (raw text):", text);
          }
        } catch (error_) {
          console.debug("Could not retrieve raw response from error.", error_);
        }
      } finally {
        if (!signal?.aborted) {
          setIsSaving(false);
        }
      }
    },
    [supabase, t, queryClient, navigate]
  );

  useEffect(() => {
    const abortController = new AbortController();

    const urlFromParams = searchParams.get("url");
    if (urlFromParams && !wasUrlAlreadyAutoImported(urlFromParams)) {
      markUrlAsAutoImported(urlFromParams);
      setUrlInput(urlFromParams);
      handleSave(urlFromParams, abortController.signal);
    } else if (!urlFromParams) {
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
    }

    return () => {
      abortController.abort();
    };
  }, [searchParams, handleSave, t]);

  const saveFooter = (
    <>
      <div className="h-[100px]"></div>

      <div className="fixed bottom-0 w-full max-w-lg bg-background z-20 p-4 flex gap-2 border-border border-t-[1px]">
        {isSaving || data !== null ? (
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
        {!isSaving && !data && (
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
              disabled={isSaving}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave(urlInput);
                }
              }}
            />
          </Field>
        )}

        {isSaving && (
          <div className="flex flex-col items-center justify-center w-full gap-8">
            <LoadingDots />

            <p className="second-font text-center">
              {t("urlImport.importingMessage")}
              <br />
              {t("urlImport.importingDescription")}
            </p>
          </div>
        )}

        {data && (
          <div className="flex flex-col w-full gap-4">
            <h2 className="text-lg font-bold second-font">{t("urlImport.importedRecipe")}</h2>

            <RecipeCard key={data.id} id={data.id} name={data.name} averageRating={null} />
          </div>
        )}
      </div>
    </Layout>
  );
}
