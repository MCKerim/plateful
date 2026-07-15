import { useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { isDuplicateCollectionNameError } from "@/api/collection.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateCollection,
  useUpdateCollection,
} from "@/hooks/collections/useCollections";
import {
  collectionColorKeys,
  getCollectionColorNameKey,
  isCollectionColorKey,
  resolveCollectionColor,
  type CollectionColorKey,
} from "@/lib/collectionColorPalette";
import type { RecipeCollection } from "@/types/exportedDatabaseTypes.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: string;
  collection?: RecipeCollection | null;
  onSaved?: (collection: RecipeCollection) => void;
};

const collectionNameMaxLength = 20;

export default function CollectionFormDialog({
  open,
  onOpenChange,
  householdId,
  collection,
  onSaved,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const [name, setName] = useState(collection?.name ?? "");
  const [colorKey, setColorKey] = useState<CollectionColorKey>(
    collection?.color_key && isCollectionColorKey(collection.color_key)
      ? collection.color_key
      : "orange"
  );
  const [error, setError] = useState<string | null>(null);
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const isPending = createCollection.isPending || updateCollection.isPending;

  async function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t("collections.errors.nameRequired"));
      return;
    }

    if (trimmedName.length > collectionNameMaxLength) {
      setError(t("collections.errors.nameTooLong"));
      return;
    }

    setError(null);
    try {
      const saved = collection
        ? await updateCollection.mutateAsync({
            collectionId: collection.id,
            name: trimmedName,
            colorKey,
          })
        : await createCollection.mutateAsync({ householdId, name: trimmedName, colorKey });

      toast.success(
        t(collection ? "collections.updated" : "collections.created", { name: saved.name })
      );
      onSaved?.(saved);
      onOpenChange(false);
    } catch (caughtError) {
      const message = isDuplicateCollectionNameError(caughtError)
        ? t("collections.errors.duplicateName")
        : t("collections.errors.saveFailed");
      setError(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t(collection ? "collections.editTitle" : "collections.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label htmlFor="collection-name">{t("collections.name")}</Label>
            <Input
              id="collection-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={collectionNameMaxLength}
              autoFocus
              aria-invalid={!!error}
            />
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
          </div>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">{t("collections.color")}</legend>
            <div className="grid grid-cols-6 gap-3">
              {collectionColorKeys.map((key) => {
                const swatchStyle = {
                  "--collection-light": resolveCollectionColor(key, "light"),
                  "--collection-dark": resolveCollectionColor(key, "dark"),
                } as CSSProperties;
                const colorName = t(getCollectionColorNameKey(key));
                const selected = colorKey === key;

                return (
                  <button
                    key={key}
                    type="button"
                    className={`aspect-square min-h-10 rounded-full bg-[var(--collection-light)] dark:bg-[var(--collection-dark)] ring-offset-2 ring-offset-background ${
                      selected ? "ring-2 ring-foreground" : ""
                    }`}
                    style={swatchStyle}
                    aria-label={colorName}
                    aria-pressed={selected}
                    title={colorName}
                    onClick={() => setColorKey(key)}
                  />
                );
              })}
            </div>
          </fieldset>
        </div>

        <DialogFooter>
          <div className="flex w-full gap-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="accent"
              className="w-full"
              disabled={isPending}
              onClick={handleSubmit}
            >
              {isPending ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
