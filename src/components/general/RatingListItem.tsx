import { useState } from "react";
import { formatDateByLocale } from "@/lib/dateHelper/dateHelper";
import { Pencil, Trash2 } from "lucide-react";
import { RecipeRatingWithUser } from "./RatingModal";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import DeleteDialog from "./DeleteDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { ratingAuthorLabel } from "@/lib/ratingAuthorLabel";

type Props = {
  rating: RecipeRatingWithUser;
  canModify: boolean;
  handleEditRating: (rating: RecipeRatingWithUser) => void;
  handleDeleteRating: (ratingId: string) => void;
};

export default function RatingListItem({
  rating,
  canModify,
  handleEditRating,
  handleDeleteRating,
}: Readonly<Props>) {
  const { t } = useTranslation();

  const [deleteOpen, setDeleteOpen] = useState(false);

  const content = (
    <>
      <div className="flex justify-between items-center">
        <p className="font-semibold">{ratingAuthorLabel(rating, t("rating.formerMember"))}</p>
        <p className="text-sm text-muted-foreground">{formatDateByLocale(rating.created_at)}</p>
      </div>

      <div>
        {Array.from({ length: 5 }, (_, index) => {
          return index < rating.stars ? (
            <StarIcon key={index} style={{ fontSize: "16px" }} />
          ) : (
            <StarBorderIcon key={index} style={{ fontSize: "16px" }} />
          );
        })}
      </div>

      <p className="break-words whitespace-pre-wrap">{rating.note}</p>
    </>
  );

  if (!canModify) return <div className="mb-6">{content}</div>;

  // The member's own rating: tapping it opens Edit / Delete, like iOS — no extra control on the row.
  return (
    <div className="mb-6">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button type="button" className="block w-full text-left">
            {content}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem className="py-2.5 text-base" onSelect={() => handleEditRating(rating)}>
            <Pencil />
            {t("common.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="py-2.5 text-base text-destructive focus:text-destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 />
            {t("common.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDelete={() => handleDeleteRating(rating.id)}
      />
    </div>
  );
}
