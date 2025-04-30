import Layout from "@/components/layout/Layout";
import { ModeToggle } from "@/components/atoms/mode-toggle";
import { Button } from "@/components/ui/button";
import supabase from "@/utils/supabase";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { useEffect } from "react";

export default function Settings() {
  const { t, i18n } = useTranslation();

  function myCallback() {
    console.log('The user was identified');
  }

  useEffect(() => {
    // Benutzeridentifikation mit Canny
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data) {
        console.error("Error fetching user: ", error);
        return;
      }

      console.log("User: ", data.user.email);

      if (window.Canny) {
        window.Canny("identify", {
          appID: "6811199a61c6b4f3d0e8cd93", // Ersetzen Sie dies durch Ihre App-ID
          user: {
            id: data.user.id, // Benutzer-ID
            email: data.user.email, // Benutzer-E-Mail
            name: data.user.user_metadata.full_name || "Anonymous", // Benutzername
            avatarURL: data.user.user_metadata.avatar_url || "", // Benutzer-Avatar (optional)
            created: new Date(data.user.created_at).toISOString(), // Benutzer-Erstellungsdatum
          },
        }, myCallback);
      }
    });
  }, []);

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
          <h2>Support & Feedback</h2>

          <NavLink data-canny-link to="https://plateful.canny.io/support/create" target="blank">
            <Button variant="secondary" className="w-full">
              Suggest a feature or report a bug
            </Button>
          </NavLink>

          <NavLink data-canny-link to="https://plateful.canny.io/changelog" target="blank">
            <Button variant="secondary" className="w-full">
              Find out what's new
            </Button>
          </NavLink>

          <NavLink data-canny-link to="https://plateful.canny.io" target="blank">
            <Button variant="secondary" className="w-full">
              See our Roadmap
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
