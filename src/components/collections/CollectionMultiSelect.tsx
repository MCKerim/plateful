import { useState, type CSSProperties } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import CollectionFormDialog from "@/components/collections/CollectionFormDialog";
import { useCollections } from "@/hooks/collections/useCollections";
import { resolveCollectionColor } from "@/lib/collectionColorPalette";

type Props = {
  householdId: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

export default function CollectionMultiSelect({
  householdId,
  selectedIds,
  onChange,
  disabled = false,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const { data: collections = [], isLoading, isError } = useCollections(householdId);
  const [createOpen, setCreateOpen] = useState(false);

  function toggle(collectionId: string, selected: boolean) {
    onChange(
      selected
        ? [...new Set([...selectedIds, collectionId])]
        : selectedIds.filter((id) => id !== collectionId)
    );
  }

  return (
    <div className="grid gap-3">
      {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
      {isError && (
        <p className="text-sm text-destructive" role="alert">
          {t("collections.errors.loadFailed")}
        </p>
      )}
      {!isLoading && !isError && collections.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("collections.noneYet")}</p>
      )}

      <div className="grid gap-2">
        {collections.map((collection) => {
          const checked = selectedIds.includes(collection.id);
          const colorStyle = {
            "--collection-light": resolveCollectionColor(collection.color_key, "light"),
            "--collection-dark": resolveCollectionColor(collection.color_key, "dark"),
          } as CSSProperties;

          return (
            <label
              key={collection.id}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2"
            >
              <Checkbox
                checked={checked}
                disabled={disabled}
                onCheckedChange={(value) => toggle(collection.id, value === true)}
                aria-label={collection.name}
              />
              <span
                className="h-4 w-4 shrink-0 rounded-full bg-[var(--collection-light)] dark:bg-[var(--collection-dark)]"
                style={colorStyle}
                aria-hidden="true"
              />
              <span className="break-words">{collection.name}</span>
            </label>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="justify-self-start"
        disabled={disabled}
        onClick={() => setCreateOpen(true)}
      >
        <Plus />
        {t("collections.new")}
      </Button>

      <CollectionFormDialog
        key={`new-${createOpen}`}
        open={createOpen}
        onOpenChange={setCreateOpen}
        householdId={householdId}
        onSaved={(collection) => toggle(collection.id, true)}
      />
    </div>
  );
}
