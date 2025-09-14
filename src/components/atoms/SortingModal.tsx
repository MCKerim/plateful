import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import FilterAltIcon from "@mui/icons-material/FilterAlt";

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

  const handleApply = () => {
    if (onSortChange) {
      onSortChange(selectedSort);
    }
    setOpen(false);
  };

  const handleValueChange = (value: string) => {
    setSelectedSort(value);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="icon" className="size-8">
          <FilterAltIcon />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sortierung</DialogTitle>
        </DialogHeader>

        <DialogDescription className="flex flex-col gap-4 py-4">
          <div className="flex justify-between gap-2 px-6">
            <RadioGroup
              defaultValue="comfortable"
              value={selectedSort}
              onValueChange={handleValueChange}
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
        </DialogDescription>

        <DialogFooter>
          <Button onClick={handleApply}>Anwenden</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
