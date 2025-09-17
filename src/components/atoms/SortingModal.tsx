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
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectSorting,
  setSorting,
} from "@/redux/slices/filterAndSortingSlice";

const sortOptions = [
  { label: "Neueste", value: "newest" },
  { label: "Älteste", value: "oldest" },
  { label: "Bewertung", value: "rating" },
  { label: "A bis Z", value: "a-z" },
];

export default function SortingModal() {
  const dispatch = useAppDispatch();
  const sorting = useAppSelector(selectSorting);

  const [open, setOpen] = useState(false);

  const handleValueChange = (value: string) => {
    dispatch(setSorting(value));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full size-9">
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
              value={sorting}
              onValueChange={handleValueChange}
              className="space-y-2"
            >
              {sortOptions.map((option) => (
                <div className="flex" key={option.value}>
                  <Label
                    htmlFor={`r-${option.value}`}
                    className={
                      "w-full" +
                      (sorting === option.value ? " font-bold text-accent" : "")
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
