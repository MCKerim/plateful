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

type Props = {
  onCategoryChange: (newCategory: string) => void;
  currentCategory: string;
};

export default function FilterModal({
  onCategoryChange,
  currentCategory,
}: Readonly<Props>) {
  const [selectedCategory, setSelectedCategory] = useState(currentCategory);
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    onCategoryChange(selectedCategory);

    setOpen(false);
  };

  const toggleCategory = (categoryId: number) => {
    if (selectedCategory === categoryId.toString()) {
      setSelectedCategory("all");
    } else {
      setSelectedCategory(categoryId.toString());
    }
  };

  const handleReset = () => {
    setSelectedCategory("all");
    onCategoryChange("all");
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelectedCategory(currentCategory);
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
                    selectedCategory === category.id.toString()
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
            {selectedCategory !== "all" && (
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
