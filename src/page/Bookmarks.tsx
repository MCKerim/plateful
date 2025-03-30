import Layout from "@/components/layout/Layout";
import { useTranslation } from "react-i18next";

export default function Bookmarks() {
  const { t } = useTranslation();

  return (
    <Layout>
      <h1 className="text-2xl">{t("bookmarks.title")}</h1>
    </Layout>
  );
}
