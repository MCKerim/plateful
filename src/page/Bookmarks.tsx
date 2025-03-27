import Layout from "@/components/layout/Layout";
import { useTranslation } from "react-i18next";

export default function Bookmarks() {
  const { t, i18n } = useTranslation();

  return (
    <Layout>
      <h1 className="text-2xl">{t("settings.title")}</h1>
      
      <button onClick={() => i18n.changeLanguage('en')}>English</button>
      
      <button onClick={() => i18n.changeLanguage('de')}>Deutsch</button>
    </Layout>
  );
}
