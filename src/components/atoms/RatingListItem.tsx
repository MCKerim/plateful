import { formatDateByLocale } from "@/lib/dateHelper";
import { Button } from "../ui/button";
import { Edit, Trash2 } from "lucide-react";
import { RecipeRatingWithUser } from "./RatingModal";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import DeleteDialog from "./DeleteDialog";

type Props = {
  rating: RecipeRatingWithUser;
  canModify: boolean;
  handleEditRating: (rating: RecipeRatingWithUser) => void;
  handleDeleteRating: (ratingId: number) => void;
};

export default function RatingListItem({
  rating,
  canModify,
  handleEditRating,
  handleDeleteRating,
}: Readonly<Props>) {
  return (
    <div className="mb-6" key={rating.id}>
      <div className="flex justify-between items-center">
        <p className="font-semibold second-font">{rating.users.username}</p>

        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {formatDateByLocale(rating.created_at)}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          {Array.from({ length: 5 }, (_, index) => {
            return index < rating.stars ? (
              <StarIcon key={index} style={{ fontSize: "16px" }} />
            ) : (
              <StarBorderIcon key={index} style={{ fontSize: "16px" }} />
            );
          })}
        </div>

        {canModify && (
          <div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditRating(rating)}
            >
              <Edit size={16} />
            </Button>

            <DeleteDialog onDelete={() => handleDeleteRating(rating.id)} />
          </div>
        )}
      </div>

      <p className="text-wrap break-words">{rating.note}</p>
    </div>
  );
}
