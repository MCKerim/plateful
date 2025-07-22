import Layout from "@/components/layout/Layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/redux/hooks";
import { selectHousehold } from "@/redux/slices/householdSlice";
import { Donut, House, Newspaper, Map } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

export default function Home() {
  const { t } = useTranslation();
  const household = useAppSelector(selectHousehold);

  return (
    <Layout>
      <div className="flex items-center gap-2">
        <House />

        <h1 className="flex items-center gap-2 text-2xl font-bold">
          {household?.name}
        </h1>
      </div>

      <p className="mt-2 italic text-muted-foreground">
        {t("home.enjoyCooking")}
      </p>

      <div className="flex flex-col gap-2 p-2 border-t">
        <NavLink
          data-canny-link
          to="https://plateful.canny.io/support/create"
          target="blank"
        >
          <Button
            variant="secondary"
            className="w-full font-bold bg-accent text-accent-foreground"
          >
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

        <NavLink data-canny-link to="https://plateful.canny.io" target="blank">
          <Button variant="secondary" className="w-full">
            <Map />

            {t("settings.viewRoadmap")}
          </Button>
        </NavLink>
      </div>
    </Layout>
  );
}
