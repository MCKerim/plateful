import Layout from "@/components/layout/Layout";
import { ModeToggle } from "@/components/atoms/mode-toggle";
import { Button } from "@/components/ui/button";
import supabase from "@/utils/supabase";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { useEffect } from "react";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import { Donut, House, Newspaper, Map, Globe } from "lucide-react";
import { FaInstagram, FaThreads, FaTiktok } from "react-icons/fa6";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const user = useAppSelector(selectUser);

  const environment = import.meta.env.VITE_NODE_ENV;

  useEffect(() => {
    // Benutzeridentifikation mit Canny
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data) {
        console.error("Error fetching user: ", error);
        return;
      }

      if (window.Canny) {
        window.Canny("identify", {
          appID: "6811199a61c6b4f3d0e8cd93",
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata.full_name ?? "Anonymous",
            avatarURL: data.user.user_metadata.avatar_url ?? "",
            created: new Date(data.user.created_at).toISOString(),
          },
        });
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
      <h1 className="text-2xl">{t("settings.title")}</h1>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 p-2 border rounded-lg">
          <h2 className="font-medium border-b">{t("settings.language")}</h2>

          <div className="flex w-full gap-2">
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

        <div className="flex flex-col gap-2 p-2 border rounded-lg">
          <h2 className="font-medium border-b">{t("settings.appearance")}</h2>

          <ModeToggle />
        </div>

        <div className="flex flex-col gap-2 p-2 border rounded-lg">
          <h2 className="font-medium border-b">{t("settings.household")}</h2>

          <p className="text-sm">
            {t("settings.householdDescription")}
          </p>

          <NavLink to="/householdSettings">
            <Button variant="secondary" className="w-full">
              <House />

              {t("settings.manageYourHousehold")}
            </Button>
          </NavLink>
        </div>

        <div className="flex flex-col gap-2 p-2 border rounded-lg">
          <h2 className="font-medium border-b">
            {t("settings.supportFeedback")}
          </h2>

          <p className="text-sm">{t("settings.supportFeedbackDescription")}</p>

          <NavLink
            data-canny-link
            to="https://plateful.canny.io/support/create"
            target="blank"
          >
            <Button variant="secondary" className="w-full">
              <Donut />

              {t("settings.suggestFeatureOrReportBug")}
            </Button>
          </NavLink>

          <NavLink
            data-canny-link
            to="https://plateful.canny.io/changelog"
            target="blank"
          >
            <Button variant="secondary" className="w-full">
              <Newspaper />

              {t("settings.whatsNew")}
            </Button>
          </NavLink>

          <NavLink
            data-canny-link
            to="https://plateful.canny.io"
            target="blank"
          >
            <Button variant="secondary" className="w-full">
              <Map />

              {t("settings.viewRoadmap")}
            </Button>
          </NavLink>
        </div>

        <div className="flex flex-col gap-2 p-2 border rounded-lg">
          <h2 className="font-medium border-b">About</h2>

          <div className="flex items-center gap-2">
            <img src="/PB.jpg" alt="Plateful Logo" className="w-20 h-20 mb-2 border-2 border-dashed rounded-full border-accent" />

            <p className="text-sm">
              {t("settings.aboutDescription")}
            </p>
          </div>

          <div className="flex py-2 justify-evenly">
            <NavLink to="https://kblanks.com/" target="_blank">
              <Globe size={24} />
            </NavLink>

            <NavLink to="https://www.threads.com/@kblanks_com" target="_blank">
              <FaThreads size={24} />
            </NavLink>

            <NavLink to="https://www.instagram.com/KBlanks_com" target="_blank">
              <FaInstagram size={24} />
            </NavLink>

            <NavLink to="https://www.tiktok.com/@KBlanks.com" target="_blank">
              <FaTiktok size={24} />
            </NavLink>
          </div>
        </div>

        <div className="flex flex-col gap-2 p-2 border rounded-lg">
          <h2 className="font-medium border-b">Info</h2>

          <p className="text-sm">
            v0.0.0 <span>- Beta </span>
            {environment === "preview" && <span>- Preview </span>}
            {environment === "development" && <span>- Development </span>}
          </p>

          <NavLink to="/privacy">
            <Button variant="secondary" className="w-full">
              {t("settings.privacyPolicy")}
            </Button>
          </NavLink>

          <NavLink to="/terms">
            <Button variant="secondary" className="w-full">
              {t("settings.termsOfService")}
            </Button>
          </NavLink>
        </div>

        <div className="flex flex-col gap-2 p-2 border rounded-lg">
          <h2 className="font-medium border-b">{t("settings.dangerZone")}</h2>

          {user?.email}

          <Button variant="destructive" onClick={signOut}>
            {t("settings.signOut")}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
