import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useSupabase } from "@/utils/supabase";
import { useTranslation } from "react-i18next";

export default function URLImport() {
  const { t } = useTranslation();
  const [urlInput, setUrlInput] = useState("");
  const { supabase } = useSupabase();
  const [isSaving, setIsSaving] = useState(false);

  const [data, setData] = useState<any>(null);

  async function handleSave() {
    if (!urlInput?.trim()) return;
    setIsSaving(true);
    try {
      console.log("Calling recipe-from-url with", urlInput);
      const { data, error } = await supabase.functions.invoke(
        "recipe-from-url",
        {
          body: {
            url: urlInput.trim(),
          },
        }
      );

      if (error) {
        console.error("Edge function returned error:", error);
        setData(error);
      } else {
        console.log("recipe-from-url response:", data);
        setData(data);
      }
    } catch (err: unknown) {
      console.error("Unexpected error calling recipe-from-url:", err);
      try {
        // Attempt to access error.response.text() safely using `any`.
        const anyErr = err as any;
        if (anyErr?.response && typeof anyErr.response.text === "function") {
          const text = await anyErr.response.text();
          console.error("Edge function returned (raw text):", text);
        }
      } catch (error_) {
        // silent fallback if we cannot read raw body
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
          onClick={handleSave}
          disabled={isSaving}
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
        <Field>
          <FieldLabel htmlFor="url"> Rezept-Link</FieldLabel>

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
            autoFocus
          />
        </Field>
      </div>

      {data && (
        <div className="mt-4 p-4 border border-border rounded-lg w-full">
          <h2 className="text-lg font-semibold mb-2">Importierte Daten:</h2>
          <pre className="whitespace-pre-wrap break-all">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </Layout>
  );
}
