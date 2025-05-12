import { NavLink } from "react-router";
import { Card } from "../ui/card";
import StarIcon from "@mui/icons-material/Star";
import StarHalfIcon from "@mui/icons-material/StarHalf";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import TagPill from "./TagPill";

type Props = {
  id: number;
  name: string;
  description: string;
};

export default function RecipeCard({ id, name, description }: Readonly<Props>) {
  const MAX_DESCRIPTION_SIZE = 55;
  const truncatedDescription =
    description.length > MAX_DESCRIPTION_SIZE
      ? description.slice(0, MAX_DESCRIPTION_SIZE) + "..."
      : description;

  function renderStars() {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < 3) {
        stars.push(<StarIcon key={i} fontSize="small" />);
      } else if (i === 3) {
        stars.push(<StarHalfIcon key={i} fontSize="small" />);
      } else {
        stars.push(<StarBorderIcon key={i} fontSize="small" />);
      }
    }
    return stars;
  }

  return (
    <NavLink to={`/recipe/${id}`} className="w-full">
      <Card>
        <img
          src={
            "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
          }
          alt="Recipe"
          className="h-full w-full object-cover"
        />

        <div className="p-2">
          <div className="flex justify-between">
            <h1 className="font-bold text-lg leading-tight">{name} dwad dawdwdawd dawdwadwa da wd</h1>

            <div className="flex gap-1">{renderStars()}</div>
          </div>

          {description && (
            <div>
              <p className="text-sm">{truncatedDescription}</p>
            </div>
          )}

          <div className="flex justify-between mt-2">
            <div className="flex gap-1">
              <TagPill name="Vegan" color="bg-green-100 text-green-800" />
              <TagPill
                name="Gluten-Free"
                color="bg-orange-100 text-orange-800"
              />
              <TagPill name="Keto" color="bg-purple-100 text-purple-800" />
              <TagPill name="Paleo" color="bg-blue-100 text-blue-800" />
            </div>

            <div className="italic text-sm">vor 2 Tagen</div>
          </div>
        </div>
      </Card>
    </NavLink>
  );
}
