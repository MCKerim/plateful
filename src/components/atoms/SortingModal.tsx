import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import SwapVertRoundedIcon from "@mui/icons-material/SwapVertRounded";

type Props = {
  onSortChange: (newSort: string) => void;
  currentSort: string;
};

const sortOptions = [
  { label: "Bewertung", value: "rating" },
  { label: "Neueste", value: "newest" },
  { label: "Älteste", value: "oldest" },
  { label: "A bis Z", value: "a-z" },
];

export default function SortingModal({
  onSortChange,
  currentSort,
}: Readonly<Props>) {
  const [selectedSort, setSelectedSort] = useState(currentSort);
  const [open, setOpen] = useState(false);

  const handleValueChange = (value: string) => {
    setSelectedSort(value);
    onSortChange(value);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="icon" className="size-9">
          <SwapVertRoundedIcon />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rezepte sortieren nach</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col py-4">
          <div>
            <RadioGroup
              defaultValue="comfortable"
              value={selectedSort}
              onValueChange={handleValueChange}
              className="space-y-2"
            >
              {sortOptions.map((option) => (
                <div className="flex" key={option.value}>
                  <Label
                    htmlFor={`r-${option.value}`}
                    className={
                      "w-full" +
                      (selectedSort === option.value
                        ? " font-bold text-accent"
                        : "")
                    }
                  >
                    {option.label}
                  </Label>

                  <RadioGroupItem
                    value={option.value}
                    id={`r-${option.value}`}
                  />
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
