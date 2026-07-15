import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RecipeCollection } from "@/types/exportedDatabaseTypes.types";

type Props = {
  collection: RecipeCollection | null;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
};

export default function CollectionDeleteDialog({
  collection,
  loading,
  onOpenChange,
  onDelete,
}: Readonly<Props>) {
  const { t } = useTranslation();

  return (
    <Dialog open={!!collection} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("collections.deleteTitle", { name: collection?.name })}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="grid gap-4">
          <p>{t("collections.deleteDescription")}</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              disabled={loading}
              onClick={onDelete}
            >
              {loading ? t("common.deleting") : t("common.delete")}
            </Button>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
