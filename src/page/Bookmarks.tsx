import Layout from "@/components/layout/Layout";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import supabase from "@/utils/supabase";
import { useTranslation } from "react-i18next";

export default function Bookmarks() {
  const { t, i18n } = useTranslation();

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error while sign out: ", error);
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl">{t("settings.title")}</h1>

      <h2>{t("settings.language")}</h2>

      <div className="w-full flex gap-2">
        <Button
          className="w-full"
          variant="secondary"
          onClick={() => i18n.changeLanguage("en")}
        >
          English
        </Button>

        <Button
          className="w-full"
          variant="secondary"
          onClick={() => i18n.changeLanguage("de")}
        >
          Deutsch
        </Button>
      </div>

      <h2>Design</h2>
      <ModeToggle />

      <h2>Danger</h2>
      <Button variant="destructive" onClick={signOut}>
        Sign out
      </Button>
    </Layout>
  );
}
