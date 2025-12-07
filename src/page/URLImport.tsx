import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function URLImport() {
  const { t } = useTranslation();
  const [urlInput, setUrlInput] = useState("");

  function handleSave() {
    console.log("saving");
  }

  const saveFooter = (
    <>
      <div className="h-[100px]"></div>

      <div className="fixed bottom-0 w-full max-w-lg bg-background z-20 p-4 flex gap-2 border-border border-t-[1px]">
        <Button className="w-full" variant="accent" onClick={handleSave}>
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

          <FieldDescription>z.B.: TikTok, YouTube, Webseite</FieldDescription>

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
    </Layout>
  );
}
