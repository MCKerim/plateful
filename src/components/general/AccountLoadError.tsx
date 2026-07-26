import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

type Props = {
  onRetry: () => void;
};

export default function AccountLoadError({ onRetry }: Readonly<Props>) {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-5 text-center">
        <div className="rounded-full bg-muted p-4 text-muted-foreground">
          <RefreshCw aria-hidden="true" className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h1 className="first-font text-2xl font-bold">{t("accountLoadError.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("accountLoadError.description")}</p>
        </div>

        <Button className="w-full" onClick={onRetry}>
          {t("accountLoadError.retry")}
        </Button>
      </div>
    </main>
  );
}
