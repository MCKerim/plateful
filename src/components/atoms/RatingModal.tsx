import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { forwardRef, useImperativeHandle, useState } from "react";
import { DialogDescription } from "@radix-ui/react-dialog";
import { CalendarDays } from "lucide-react";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

type Props = {
  showTriggerButton?: boolean;
  recipeId?: number;
};

export type RatingModalRef = {
  open: () => void;
};

const RatingModal = forwardRef<RatingModalRef, Props>(
  ({ showTriggerButton = true, recipeId }: Readonly<Props>, ref) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Expose the `open` method via the ref
    useImperativeHandle(ref, () => ({
      open: () => setIsDialogOpen(true),
    }));

    const [rating, setRating] = useState(1);
    const [note, setNote] = useState("");

    function handleDialogOpenChange(isOpen: boolean) {
      setIsDialogOpen(isOpen);
    }

    return (
      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        {showTriggerButton && (
          <DialogTrigger>
            <Button variant="outline" className="w-full">
              {
                <>
                  <CalendarDays />
                  Rate
                </>
              }
            </Button>
          </DialogTrigger>
        )}

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wie hat es dir geschmeckt? {recipeId}</DialogTitle>
          </DialogHeader>

          <DialogDescription className="flex flex-col py-4 gap-4">
            <div className="flex gap-2 justify-between px-6">
              {Array.from({ length: 5 }, (_, index) => {
                const starValue = index + 1;

                return (
                  <button key={index} onClick={() => setRating(starValue)}>
                    {rating >= starValue ? (
                      <StarIcon fontSize="large" />
                    ) : (
                      <StarBorderIcon fontSize="large" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="grid w-full items-center gap-2">
              <Label htmlFor="note">Anmerkungen</Label>

              <Input
                type="text"
                id="note"
                placeholder="Nächstes mal weniger..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </DialogDescription>

          <DialogFooter>
            <Button onClick={() => {}}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export default RatingModal;
