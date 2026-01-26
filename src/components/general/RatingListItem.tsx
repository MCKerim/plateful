import { formatDateByLocale } from "@/lib/dateHelper/dateHelper";
import { Button } from "../ui/button";
import { Edit, MoreVertical, Trash2 } from "lucide-react";
import { RecipeRatingWithUser } from "./RatingModal";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import DeleteDialog from "./DeleteDialog";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerTrigger } from "../ui/drawer";
import { useTranslation } from "react-i18next";

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

        <div className="flex items-center gap-1">
          <p className="text-sm text-muted-foreground">{formatDateByLocale(rating.created_at)}</p>

          {canModify && (
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical size={16} />
                </Button>
              </DrawerTrigger>

              <DrawerContent>
                <DrawerFooter className="gap-2 mb-8 mt-4">
                  <DrawerClose asChild>
                    <Button className="w-full" onClick={() => handleEditRating(rating)}>
                      <Edit size={16} />

                      {t("common.edit")}
                    </Button>
                  </DrawerClose>

                  <DeleteDialog
                    onDelete={() => handleDeleteRating(rating.id)}
                    customTrigger={
                      <Button className="w-full" variant="destructive">
                        <Trash2 size={16} />

                        {t("common.delete")}
                      </Button>
                    }
                  />
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          )}
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
      </div>

      <p className="text-wrap break-words">{rating.note}</p>
    </div>
  );
}
