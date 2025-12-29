import { formatDateByLocale } from "@/lib/dateHelper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Edit, MoreVertical, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RecipeRatingWithUser } from "./RatingModal";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

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
  const { t } = useTranslation();

  return (
    <div className="mb-6" key={rating.id}>
      <div className="flex justify-between items-center">
        <p className="font-semibold second-font">{rating.users.username}</p>

        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {formatDateByLocale(rating.created_at)}
          </p>

          {canModify && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEditRating(rating)}>
                  <Edit size={16} className="mr-2" />
                  {t("rating.edit")}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => handleDeleteRating(rating.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 size={16} className="mr-2" />
                  {t("rating.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
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

      <p className="text-wrap break-words">{rating.note}</p>
    </div>
  );
}
