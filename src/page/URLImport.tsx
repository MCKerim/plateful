import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useSupabase } from "@/utils/supabase";
import { useTranslation } from "react-i18next";
import LoadingDots from "@/components/atoms/LoadingDots";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router";
import RecipeCard from "@/components/atoms/RecipeCard";

export default function URLImport() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [urlInput, setUrlInput] = useState("");
  const { supabase } = useSupabase();
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<any>(null);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const urlFromParams = searchParams.get("url");
    if (urlFromParams) {
      setUrlInput(urlFromParams);
      handleSave(urlFromParams);
    } else {
      async function autoPasteFromClipboard() {
        try {
          const text = await navigator.clipboard.readText();
          if (text.startsWith("http://") || text.startsWith("https://")) {
            setUrlInput(text);
            toast.success("Link automatisch eingefügt!", {
              position: "top-right",
              richColors: true,
            });
          }
        } catch (err) {
          console.debug(
            "Kein Zugriff auf die Zwischenablage oder ungültiger Inhalt.",
            err
          );
        }
      }

      autoPasteFromClipboard();
    }
  }, [searchParams]);

  async function handleSave(url = urlInput) {
    if (!url?.trim()) return;

    // Validate URL
    try {
      new URL(url.trim());
    } catch {
      toast.error("Ungültige URL. Bitte überprüfe den Link.", {
        position: "top-right",
        richColors: true,
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "recipe-from-url",
        {
          body: {
            url: url.trim(),
          },
        }
      );

      if (error) {
        console.error("Edge function returned error:", error);
        toast.error("Fehler beim Importieren des Rezepts.", {
          position: "top-right",
          richColors: true,
        });
      } else {
        console.log("recipe-from-url response:", data);
        setData(data[0]);
        toast.success("Recipe Imported!", {
          position: "top-right",
          richColors: true,
          action: {
            label: "View",
            onClick: () => {
              navigate(`/recipe/${data[0].id}`);
            },
          },
        });
      }
    } catch (err: unknown) {
      console.error("Unexpected error calling recipe-from-url:", err);
      toast.error("Unerwarteter Fehler beim Importieren des Rezepts.", {
        position: "top-right",
        richColors: true,
      });

      try {
        const anyErr = err as any;
        if (anyErr?.response && typeof anyErr.response.text === "function") {
          const text = await anyErr.response.text();
          console.error("Edge function returned (raw text):", text);
        }
      } catch (error_) {
        console.debug("Could not retrieve raw response from error.", error_);
      }
    } finally {
      setIsSaving(false);
    }
  }

  const saveFooter = (
    <>
      <div className="h-[100px]"></div>

      <div className="fixed bottom-0 w-full max-w-lg bg-background z-20 p-4 flex gap-2 border-border border-t-[1px]">
        <Button
          className="w-full"
          variant="accent"
          onClick={() => handleSave()} // Ensure no arguments are passed
          disabled={isSaving || data !== null}
        >
          {t("common.save")}
        </Button>
      </div>
    </>
  );

  return (
    <Layout showHeader={false} showFooter={false} footer={saveFooter}>
      <div className="flex justify-between w-full items-center">
        <h1 className="text-2xl font-bold first-font">Rezept Importieren</h1>
      </div>

      <div className="flex items-center flex-1">
        {!isSaving && !data && (
          <Field>
            <FieldLabel htmlFor="url">Rezept-Link</FieldLabel>

            <FieldDescription>
              z.B.: TikTok, YouTube oder Webseiten-Link
            </FieldDescription>

            <Input
              id="url"
              type="text"
              placeholder="https://"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              autoComplete="off"
              disabled={isSaving}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave();
                }
              }}
            />
          </Field>
        )}

        {isSaving && (
          <div className="flex flex-col items-center justify-center w-full gap-8">
            <LoadingDots />

            <p className="second-font text-center">
              Dies kann einige Sekunden dauern...
              <br />
              Du kannst die Seite schließen und später das Rezept in deinem
              Kochbuch finden
            </p>
          </div>
        )}

        {data && (
          <div className="flex flex-col w-full gap-4">
            <h2 className="text-lg font-bold second-font">
              Importiertes Rezept
            </h2>

            <RecipeCard
              key={data.id}
              id={data.id}
              name={data.name}
              averageRating={null}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
