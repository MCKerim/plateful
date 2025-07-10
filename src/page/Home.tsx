import ChatbotFAB from "@/components/atoms/ChatbotFAB";
import Layout from "@/components/layout/Layout";
import { CommingSoon } from "@/components/ui/commingSoonOverlay";
import { useAppSelector } from "@/redux/hooks";
import { selectHousehold } from "@/redux/slices/householdSlice";
import { House } from "lucide-react";

export default function Home() {
  const household = useAppSelector(selectHousehold);

  return (
    <Layout>
      <div className="flex items-center gap-2">
        <House />

        <h1 className="text-2xl font-bold flex items-center gap-2">
          {household?.name}
        </h1>
      </div>

      <p className="mt-2 italic text-muted-foreground">
        Viel Spaß beim Kochen
      </p>

      <ChatbotFAB />

      <CommingSoon />
    </Layout>
  );
}
