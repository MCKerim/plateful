import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CollectionMultiSelect from "@/components/collections/CollectionMultiSelect";
import { useRecipeCollectionIds, useReplaceRecipeCollections } from "@/hooks/collections/useCollections";

type Props = {
  recipeId: string;
  householdId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Files a recipe into Collections from its detail page, like the native app's "Collections" menu entry. */
export default function RecipeCollectionsDialog({ recipeId, householdId, open, onOpenChange }: Readonly<Props>) {
  const { t } = useTranslation();
  const { data: memberships, isError } = useRecipeCollectionIds(open ? recipeId : null);
  const replaceCollections = useReplaceRecipeCollections();
  // The member's picks; null shows the stored memberships.
  const [draftIds, setDraftIds] = useState<string[] | null>(null);
  const selectedIds = draftIds ?? memberships ?? [];

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) setDraftIds(null);
    onOpenChange(isOpen);
  }

  function save() {
    replaceCollections.mutate(
      { recipeId, collectionIds: selectedIds },
      {
        onSuccess: () => handleOpenChange(false),
        onError: (error) => {
          console.error("Error while saving recipe collections: ", error);
          toast.error(t("collections.errors.saveFailed"));
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("collections.collections")}</DialogTitle>
        </DialogHeader>

        <CollectionMultiSelect
          householdId={householdId}
          selectedIds={selectedIds}
          onChange={setDraftIds}
          disabled={!memberships || replaceCollections.isPending}
        />

        {isError && (
          <p className="text-sm text-destructive" role="alert">
            {t("collections.errors.membershipsUnavailable")}
          </p>
        )}

        <Button onClick={save} disabled={!memberships || replaceCollections.isPending}>
          {t("common.save")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
