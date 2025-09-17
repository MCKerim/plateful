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
import { categories } from "@/lib/recipeCategoryHelper";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  resetFilter,
  selectCategoryId,
  setCategoryId,
} from "@/redux/slices/filterAndSortingSlice";

export default function FilterModal() {
  const dispatch = useAppDispatch();
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
        <Button variant="secondary" size="icon" className="size-9">
          <FilterAltIcon />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rezepte filtern nach</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col py-4">
          <div>
            <Label className="block mb-2">Kategorie</Label>

            <div className="flex flex-wrap gap-2 pl-2">
              {categories.map((category) => (
                <Button
                  variant="secondary"
                  key={category.id}
                  className={`${
                    selectedCategory === category.id
                      ? "bg-accent text-accent-foreground"
                      : ""
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
              <Button
                onClick={handleReset}
                className="w-full"
                variant="secondary"
              >
                Zurücksetzen
              </Button>
            )}

            <Button onClick={handleApply} className="w-full">
              Anwenden
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
