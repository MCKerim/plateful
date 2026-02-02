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
import { categories } from "@/lib/recipeCategoryHelper/recipeCategoryHelper";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  resetFilter,
  selectActiveFilterCount,
  selectCategoryId,
  setCategoryId,
} from "@/redux/slices/filterAndSortingSlice";

export default function FilterModal() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const activeFilterCount = useAppSelector(selectActiveFilterCount);
  const categoryId = useAppSelector(selectCategoryId);

  const [selectedCategory, setSelectedCategory] = useState(categoryId);
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    dispatch(setCategoryId(selectedCategory));
    setOpen(false);
  };

  const toggleCategory = (categoryId: number) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(0);
    } else {
      setSelectedCategory(categoryId);
    }
  };

  const handleReset = () => {
    setSelectedCategory(0);
    dispatch(resetFilter());
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelectedCategory(categoryId);
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
            <Label className="block mb-2">{t("categorys.category")}</Label>

            <div className="flex flex-wrap gap-2 pl-2">
              {categories.map((category) => (
                <Button
                  variant="secondary"
                  key={category.id}
                  className={`${
                    selectedCategory === category.id ? "bg-accent text-accent-foreground" : ""
                  }`}
                  onClick={() => toggleCategory(category.id)}
                  size="sm"
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex w-full gap-2">
            {selectedCategory !== 0 && (
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
