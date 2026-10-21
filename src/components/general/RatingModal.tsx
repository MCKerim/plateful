import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { forwardRef, useImperativeHandle, useState } from "react";
import { DialogDescription } from "@radix-ui/react-dialog";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useTranslation } from "react-i18next";
import { RecipeRatings } from "@/types/exportedDatabaseTypes.types";
import { useCreateRating } from "@/hooks/ratings/useCreateRating";
import { useUpdateRating } from "@/hooks/ratings/useUpdateRating";
import { toast } from "sonner";
import { useRecipeRatings } from "@/hooks/ratings/useRecipeRatings";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";

type Props = {
  recipeId?: string;
};

export type RatingModalRef = {
  open: (rating?: RecipeRatingWithUser) => void;
};

export type RecipeRatingWithUser = RecipeRatings & {
  users: {
    username: string | null;
  } | null;
};

const RatingModal = forwardRef<RatingModalRef, Props>(
  ({ recipeId }: Readonly<Props>, ref) => {
    const { t } = useTranslation();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // What the member changed in this dialog; null shows the rating being edited.
    const [starsInput, setStarsInput] = useState<number | null>(null);
    const [noteInput, setNoteInput] = useState<string | null>(null);
    const [editingRating, setEditingRating] = useState<RecipeRatingWithUser | null>(null);

    // One rating per member, as on iOS: opening without a rating edits the
    // member's own one (newest first, older duplicates stay editable in the
    // list), also when it loads only after the dialog opened (planner, Home).
    const currentUser = useAppSelector(selectUser);
    const { ratings } = useRecipeRatings(recipeId ?? null);
    const myRating = ratings.find((r) => r.owner_id === currentUser?.id) ?? null;
    const target = editingRating ?? myRating;
    const rating = starsInput ?? target?.stars ?? 1;
    const note = noteInput ?? target?.note ?? "";

    const createRatingMutation = useCreateRating();
    const updateRatingMutation = useUpdateRating();

    const isSubmitting = createRatingMutation.isPending || updateRatingMutation.isPending;

    useImperativeHandle(ref, () => ({
      open: (ratingToEdit?: RecipeRatingWithUser) => {
        setEditingRating(ratingToEdit ?? null);
        setStarsInput(null);
        setNoteInput(null);
        setIsDialogOpen(true);
      },
    }));

    function handleDialogOpenChange(isOpen: boolean) {
      if (!isOpen) {
        setStarsInput(null);
        setNoteInput(null);
        setEditingRating(null);
      }
      setIsDialogOpen(isOpen);
    }

    function saveButtonPressed() {
      if (!recipeId || rating < 1 || isSubmitting) {
        return;
      }

      if (target) {
        updateRatingMutation.mutate(
          {
            ratingId: target.id,
            recipeId,
            stars: rating,
            note,
          },
          {
            onSuccess: () => {
              setIsDialogOpen(false);
            },
            onError: () => {
              toast.error(t("rating.updateError"));
            },
          }
        );
      } else {
        createRatingMutation.mutate(
          {
            recipeId,
            stars: rating,
            note,
          },
          {
            onSuccess: () => {
              setIsDialogOpen(false);
            },
            onError: () => {
              toast.error(t("rating.createError"));
            },
          }
        );
      }
    }

    const isEditMode = target !== null;

    return (
      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? t("rating.editTitle") : t("rating.title")}</DialogTitle>
          </DialogHeader>

          <DialogDescription className="flex flex-col gap-4 py-4">
            <div className="flex justify-between gap-2 px-6">
              {Array.from({ length: 5 }, (_, index) => {
                const starValue = index + 1;

                return (
                  <button key={index} onClick={() => setStarsInput(starValue)} type="button">
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
                onChange={(e) => setNoteInput(e.target.value)}
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
