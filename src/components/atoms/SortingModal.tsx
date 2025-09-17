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

        <div className="flex flex-col gap-4 py-4">
          <div className="px-6 space-y-6">
            <div>
              <RadioGroup
                defaultValue="comfortable"
                value={selectedSort}
                onValueChange={handleValueChange}
                className="space-y-2"
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="rating" id="r1" />
                  <Label htmlFor="r1">Bewertung</Label>
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
                  <RadioGroupItem value="a-z" id="r4" />
                  <Label htmlFor="r4">A - Z</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
