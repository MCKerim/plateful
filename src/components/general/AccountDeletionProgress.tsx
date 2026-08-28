import { Loader2, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface AccountDeletionProgressProps {
  retrying: boolean;
  onRetry: () => void;
}

export default function AccountDeletionProgress({
  retrying,
  onRetry,
}: AccountDeletionProgressProps) {
  const { t } = useTranslation();

  return (
    <main className="min-h-dvh bg-background px-6 py-12 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          {retrying ? <ShieldCheck size={26} /> : <Loader2 className="animate-spin" size={26} />}
        </div>
        <h1 className="text-2xl">{t("settings.confirmations.deleteAccount.processingTitle")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("settings.confirmations.deleteAccount.processingDescription")}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("settings.confirmations.deleteAccount.processingCanClose")}
        </p>
        {retrying && (
          <div className="mt-6">
            <p className="mb-3 text-sm text-muted-foreground">
              {t("settings.confirmations.deleteAccount.processingRetry")}
            </p>
            <Button variant="secondary" onClick={onRetry}>
              {t("common.retry")}
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
