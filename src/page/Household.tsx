import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import supabase from "@/utils/supabase";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

export default function Hosehold() {
  const { t } = useTranslation();
  const [household, setHousehold] = useState<string | null>(null);

  const fetchHousehold = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Fehler beim Abrufen der Sitzung:", sessionError);
      return;
    }

    const userId = session?.user?.id;
    if (!userId) {
      console.error("Kein Benutzer angemeldet.");
      return;
    }

    const { data, error } = await supabase
      .from("household")
      .select("name")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Fehler beim Abrufen des Haushalts:", error);
    } else {
      setHousehold(data?.name || null);
    }
  };

  useEffect(() => {
    fetchHousehold();
  }, []);

  return (
    <Layout>
      <h1>Dein Haushalt</h1>

      {
        household ? household : "Kein Haushalt"
      }
      
    </Layout>
  );
}
