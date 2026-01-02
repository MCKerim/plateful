import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { DialogDescription } from "@radix-ui/react-dialog";
import HotelClassIcon from "@mui/icons-material/HotelClass";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useTranslation } from "react-i18next";
import { useSupabase } from "@/utils/supabase";
import { RecipeRatings } from "@/types/exportedDatabaseTypes.types";
import { RatingService } from "@/lib/services/ratingService";

type Props = {
  showTriggerButton?: boolean;
  recipeId?: number;
  ratingSubmittedCallback?: (newRating: RecipeRatingWithUser) => void;
  ratingUpdatedCallback?: (updatedRating: RecipeRatingWithUser) => void;
};

export type RatingModalRef = {
  open: (rating?: RecipeRatingWithUser) => void;
};

export type RecipeRatingWithUser = RecipeRatings & {
  users: {
    username: string;
  };
};

const RatingModal = forwardRef<RatingModalRef, Props>(
  (
    {
      showTriggerButton = true,
      recipeId,
      ratingSubmittedCallback = () => {},
      ratingUpdatedCallback = () => {},
    }: Readonly<Props>,
    ref
  ) => {
    const { supabase } = useSupabase();
    const { t } = useTranslation();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const ratingService = new RatingService(supabase);

    const [rating, setRating] = useState(1);
    const [note, setNote] = useState("");
    const [editingRating, setEditingRating] =
      useState<RecipeRatingWithUser | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Expose the `open` method via the ref
    useImperativeHandle(ref, () => ({
      open: (ratingToEdit?: RecipeRatingWithUser) => {
        if (ratingToEdit) {
          setEditingRating(ratingToEdit);
          setRating(ratingToEdit.stars);
          setNote(ratingToEdit.note || "");
        } else {
          // Reset for new rating
          setEditingRating(null);
          setRating(1);
          setNote("");
        }
        setIsDialogOpen(true);
      },
    }));

    // Reset form when dialog closes
    useEffect(() => {
      if (!isDialogOpen) {
        setNote("");
        setRating(1);
        setEditingRating(null);
      }
    }, [isDialogOpen]);

    function handleDialogOpenChange(isOpen: boolean) {
      setIsDialogOpen(isOpen);
    }

    async function saveButtonPressed() {
      if (!recipeId || rating < 1 || isSubmitting) {
        return;
      }

      setIsSubmitting(true);

      try {
        if (editingRating) {
          // Update existing rating
          const updatedRating = await ratingService.updateRating(
            editingRating.id,
            rating,
            note
          );
          ratingUpdatedCallback(updatedRating);
          setIsDialogOpen(false);
        } else {
          // Create new rating
          const newRating = await ratingService.createRating(
            recipeId,
            rating,
            note
          );
          ratingSubmittedCallback(newRating);
          setIsDialogOpen(false);
        }
      } catch (error) {
        alert(
          isEditMode
            ? "Failed to update rating. Please try again."
            : "Failed to save rating. Please try again."
        );
        setIsSubmitting(false);
      } finally {
        setIsSubmitting(false);
      }
    }

    const isEditMode = editingRating !== null;

    return (
      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        {showTriggerButton && (
          <DialogTrigger className="w-full mb-2">
            <Button variant="secondary" className="w-full">
              <HotelClassIcon />
              {t("rating.rate")}
            </Button>
          </DialogTrigger>
        )}

        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? t("rating.editTitle") : t("rating.title")}
            </DialogTitle>
          </DialogHeader>

          <DialogDescription className="flex flex-col gap-4 py-4">
            <div className="flex justify-between gap-2 px-6">
              {Array.from({ length: 5 }, (_, index) => {
                const starValue = index + 1;

                return (
                  <button
                    key={index}
                    onClick={() => setRating(starValue)}
                    type="button"
                  >
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
            <Button onClick={saveButtonPressed} disabled={isSubmitting}>
              {t("rating.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export default RatingModal;
