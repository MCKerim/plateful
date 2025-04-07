import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import supabase from "@/utils/supabase";
import { useTranslation } from "react-i18next";

export default function Hosehold() {
  const { t } = useTranslation();

  return (
    <Layout>
      <h1>Dein Haushalt</h1>
    </Layout>
  );
}
