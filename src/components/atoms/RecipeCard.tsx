import { NavLink } from "react-router";
import { Card } from "../ui/card";
import StarIcon from "@mui/icons-material/Star";
import StarHalfIcon from "@mui/icons-material/StarHalf";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import TagPill from "./TagPill";

type Props = {
  id: number;
  name: string;
};

export default function RecipeCard({ id, name }: Readonly<Props>) {
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
            "https://img.chefkoch-cdn.de/rezepte/393031127655461/bilder/1585337/crop-642x428/spaghetti-bolognese.jpg"
          }
          alt="Recipe"
          className="h-32 w-full object-cover"
        />

        <div className="p-2">
          <div className="flex justify-between">
            <h1 className="font-bold text-lg leading-tight">{name}</h1>

            <div className="flex gap-1">{renderStars()}</div>
          </div>

          <div className="flex justify-between mt-2">
            <div className="flex gap-1">
              <TagPill name="Vegan" color="green" />
              <TagPill name="Gluten-Free" color="orange" />
            </div>

            <div className="italic text-sm">vor 2 Tagen</div>
          </div>
        </div>
      </Card>
    </NavLink>
  );
}
