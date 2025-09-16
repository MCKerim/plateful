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
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
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
  onSortChange: (newSort: string) => void;
  currentSort: string;
  onCategoryChange: (newCategory: string) => void;
  currentCategory: string;
};

export default function SortingModal({
  onSortChange,
  currentSort,
  onCategoryChange,
  currentCategory,
}: Readonly<Props>) {
  const [selectedSort, setSelectedSort] = useState(currentSort);
  const [selectedCategory, setSelectedCategory] = useState(currentCategory);
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    if (onSortChange) {
      onSortChange(selectedSort);
    }
    if (onCategoryChange) {
      onCategoryChange(selectedCategory);
    }
    setOpen(false);
  };

  const handleValueChange = (value: string) => {
    setSelectedSort(value);
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
          <DialogTitle>Filter</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="px-6 space-y-6">
            <div>
              <Label className="block mb-2">Sortierung</Label>
              <RadioGroup
                defaultValue="comfortable"
                value={selectedSort}
                onValueChange={handleValueChange}
                className="space-y-2"
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="az" id="r1" />
                  <Label htmlFor="r1">A-Z</Label>
                </div>

                <div className="flex items-center gap-3">
                  <RadioGroupItem value="newest" id="r2" />
                  <Label htmlFor="r2">Neueste</Label>
                </div>

                <div className="flex items-center gap-3">
                  <RadioGroupItem value="oldest" id="r3" />
                  <Label htmlFor="r3">Älteste</Label>
                </div>

                <div className="flex items-center gap-3">
                  <RadioGroupItem value="rating" id="r4" />
                  <Label htmlFor="r4">Bewertung</Label>
                </div>
              </RadioGroup>
            </div>

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
          <Button onClick={handleApply} className="w-full">
            Anwenden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
