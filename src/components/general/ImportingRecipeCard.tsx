import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { useTranslation } from "react-i18next";

export default function ImportingRecipeCard() {
  const { t } = useTranslation();

  return (
    <Card className="relative bg-transparent border-2">
      <Skeleton className="w-full h-32 rounded-b-none" />

      <div className="flex flex-col justify-between gap-2 p-2">
        <span className="text-xs text-muted-foreground">
          {t("cookbook.importing")}
        </span>

        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </Card>
  );
}
