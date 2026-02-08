import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/redux/hooks";
import { selectHousehold } from "@/redux/slices/householdSlice";
import { selectUser } from "@/redux/slices/userSlice";
import { Donut, House } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

export default function Home() {
  const { t } = useTranslation();
  const user = useAppSelector(selectUser);
  const household = useAppSelector(selectHousehold);

  return (
    <Layout>
      <NavLink to="/householdSettings">
        <div className="flex items-center gap-2">
          <House />

          <h1 className="first-font flex items-center gap-2 text-2xl font-bold">
            {household?.name}
          </h1>
        </div>
      </NavLink>

      <p className="second-font mt-2 italic text-muted-foreground">
        {t("home.enjoyCooking", { username: user?.username })}
      </p>

      <div className="flex flex-col gap-2 p-2 border-t">
        <NavLink data-canny-link to="https://plateful.canny.io/support" target="blank">
          <Button variant="secondary" className="w-full font-bold bg-accent text-accent-foreground">
            <Donut />

            {t("settings.suggestFeatureOrReportBug")}
          </Button>
        </NavLink>
      </div>
    </Layout>
  );
}
