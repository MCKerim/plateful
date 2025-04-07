import Layout from "@/components/layout/Layout";
import { ModeToggle } from "@/components/atoms/mode-toggle";
import { Button } from "@/components/ui/button";
import supabase from "@/utils/supabase";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

export default function Settings() {
  const { t, i18n } = useTranslation();

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error while sign out: ", error);
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl mb-2">{t("settings.title")}</h1>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2>{t("settings.language")}</h2>

          <div className="w-full flex gap-2">
            <Button
              className="w-full"
              variant={i18n.language === "en" ? "default" : "secondary"}
              onClick={() => i18n.changeLanguage("en")}
            >
              English
            </Button>

            <Button
              className="w-full"
              variant={i18n.language === "de" ? "default" : "secondary"}
              onClick={() => i18n.changeLanguage("de")}
            >
              Deutsch
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h2>{t("settings.appearance")}</h2>

          <ModeToggle />
        </div>

        <div className="flex flex-col gap-2">
          <h2>{t("settings.household")}</h2>

          <NavLink to="/household">
            <Button variant="secondary" className="w-full">
              {t("settings.manageYourHousehold")}
            </Button>
          </NavLink>
        </div>

        <div className="flex flex-col gap-2">
          <h2>{t("settings.dangerZone")}</h2>

          <Button variant="destructive" onClick={signOut}>
            {t("settings.signOut")}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
