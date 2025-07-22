import Layout from "@/components/layout/Layout";
import { CommingSoon } from "@/components/ui/commingSoonOverlay";
import { useAppSelector } from "@/redux/hooks";
import { selectHousehold } from "@/redux/slices/householdSlice";
import { House } from "lucide-react";
import { useTranslation } from "react-i18next";

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

      <CommingSoon />
    </Layout>
  );
}
