import Layout from "@/components/layout/Layout";
import { CommingSoon } from "@/components/ui/commingSoonOverlay";
import { useTranslation } from "react-i18next";

export default function Explore() {
  const { t } = useTranslation();

  return (
    <Layout>
      <CommingSoon />

      <h1 className="text-2xl">{t("explore.title")}</h1>
    </Layout>
  );
}
