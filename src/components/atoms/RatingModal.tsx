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
import HotelClassIcon from "@mui/icons-material/HotelClass";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useTranslation } from "react-i18next";
import { useSupabase } from "@/utils/supabase";

type Props = {
  showTriggerButton?: boolean;
  recipeId?: number;
};

export type RatingModalRef = {
  open: () => void;
};

const RatingModal = forwardRef<RatingModalRef, Props>(
  ({ showTriggerButton = true, recipeId }: Readonly<Props>, ref) => {
    const { supabase } = useSupabase();
    const { t } = useTranslation();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Expose the `open` method via the ref
    useImperativeHandle(ref, () => ({
      open: () => setIsDialogOpen(true),
    }));

    const [rating, setRating] = useState(1);
    const [note, setNote] = useState("");

    function handleDialogOpenChange(isOpen: boolean) {
      setIsDialogOpen(isOpen);

      setNote("");
      setRating(1);
    }

    async function saveButtonPressed() {
      if (!recipeId || rating < 1) {
        return;
      }

      const { error } = await supabase
        .from("recipe_ratings")
        .insert([{ recipe_id: recipeId, stars: rating, note: note }]);

      if (error) {
        console.error("Fehler beim Speichern der Bewertung:", error.message);
        return;
      }

      setIsDialogOpen(false);
      setNote("");
      setRating(1);
    }

    return (
      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        {showTriggerButton && (
          <DialogTrigger className="w-full mb-6">
            <Button variant="secondary" className="w-full">
              <HotelClassIcon />

              {t("rating.rate")}
            </Button>
          </DialogTrigger>
        )}

        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rating.title")}</DialogTitle>
          </DialogHeader>

          <DialogDescription className="flex flex-col gap-4 py-4">
            <div className="flex justify-between gap-2 px-6">
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

            <div className="grid items-center w-full gap-2">
              <Label htmlFor="note">{t("rating.commentLabel")}</Label>

              <Textarea
                id="note"
                placeholder={t("rating.commentPlaceholder")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </DialogDescription>

          <DialogFooter>
            <Button onClick={saveButtonPressed}>{t("rating.submit")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export default RatingModal;
