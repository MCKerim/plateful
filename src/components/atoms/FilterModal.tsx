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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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

  const handleReset = () => {
    setSelectedCategory("all");
    onCategoryChange("all");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="icon" className="size-9">
          <FilterAltIcon />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rezepte filtern nach</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="px-6 space-y-6">
            <div>
              <Label className="block mb-2">Kategorie</Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Alle Kategorien" />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Alle Kategorien</SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleReset} className="w-full" variant="secondary">
            Zurücksetzen
          </Button>

          <Button onClick={handleApply} className="w-full">
            Anwenden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
