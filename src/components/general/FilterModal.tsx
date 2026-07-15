import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectActiveFilterCount,
  selectCollectionSelection,
  setCollectionSelection,
  type CollectionSelection,
} from "@/redux/slices/filterAndSortingSlice";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { useCollections } from "@/hooks/collections/useCollections";

export default function FilterModal() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const activeFilterCount = useAppSelector(selectActiveFilterCount);
  const collectionSelection = useAppSelector(selectCollectionSelection);
  const householdId = useAppSelector(selectHouseholdId);
  const { data: collections = [] } = useCollections(householdId);

  const [selectedCollection, setSelectedCollection] =
    useState<CollectionSelection>(collectionSelection);
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    dispatch(setCollectionSelection(selectedCollection ?? "all"));
    setOpen(false);
  };

  const toggleCollection = (collectionId: string) => {
    if (selectedCollection === collectionId) {
      setSelectedCollection("all");
    } else {
      setSelectedCollection(collectionId);
    }
  };

  const handleReset = () => {
    setSelectedCollection("all");
    dispatch(setCollectionSelection("all"));
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelectedCollection(collectionSelection);
    }

    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full w-14 h-9">
          <FilterAltIcon sx={{ fontSize: 20 }} />

          {activeFilterCount > 0 && (
            <div className="absolute flex items-center justify-center w-4 h-4 text-xs rounded-full text-primary-foreground bg-primary -top-0.5 -right-0.5">
              {activeFilterCount}
            </div>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("filterModal.title")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col py-4">
          <div>
            <Label className="block mb-2">{t("collections.collection")}</Label>

            <div className="flex flex-wrap gap-2 pl-2">
              <Button
                variant="secondary"
                className={selectedCollection === "all" ? "bg-accent text-accent-foreground" : ""}
                onClick={() => setSelectedCollection("all")}
                size="sm"
              >
                {t("collections.allRecipes")}
              </Button>
              {collections.map((collection) => (
                <Button
                  variant="secondary"
                  key={collection.id}
                  className={`${
                    selectedCollection === collection.id ? "bg-accent text-accent-foreground" : ""
                  }`}
                  onClick={() => toggleCollection(collection.id)}
                  size="sm"
                >
                  {collection.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex w-full gap-2">
            {selectedCollection !== "all" && (
              <Button onClick={handleReset} className="w-full" variant="secondary">
                {t("common.reset")}
              </Button>
            )}

            <Button onClick={handleApply} className="w-full">
              {t("common.apply")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
