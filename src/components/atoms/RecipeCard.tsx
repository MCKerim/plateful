import { NavLink } from "react-router";
import { Card } from "../ui/card";
import StarIcon from "@mui/icons-material/Star";
import StarHalfIcon from "@mui/icons-material/StarHalf";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import TagPill from "./TagPill";
import { CalendarDays } from "lucide-react";

type Props = {
  id: number;
  name: string;
};

export default function RecipeCard({ id, name }: Readonly<Props>) {
  function renderStars() {
    const stars = [];

    const starStyles = {
      fontSize: "16px",
    };

    for (let i = 0; i < 5; i++) {
      if (i < 3) {
        stars.push(<StarIcon key={i} style={starStyles} />);
      } else if (i === 3) {
        stars.push(<StarHalfIcon key={i} style={starStyles} />);
      } else {
        stars.push(<StarBorderIcon key={i} style={starStyles} />);
      }
    }
    return stars;
  }

  function renderTagPills() {
    const tags: string[] = [];
    return tags.map((tag, index) => (
      <TagPill key={index} name={tag} color="green" />
    ));
  }

  return (
    <NavLink to={`/recipe/${id}`} className="w-full">
      <Card className="relative">
        <img
          src={
            "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
          }
          alt="Recipe"
          className="h-32 w-full object-cover border-b-4 border-background"
        />

        <div className="p-2">
          <div className="flex justify-end">
            <div className="flex gap-1 absolute top-1 bg-card rounded-full px-1 py-[1px]">{renderStars()}</div>
          </div>

          <div className="flex justify-between">
            <h1 className="font-bold text-lg leading-tight">{name}</h1>
          </div>

          <div className="flex justify-between mt-2">
            <div className="flex gap-1">
              {renderTagPills()}
            </div>

            <div className="flex gap-1 items-center">
              <p className="italic text-sm">Noch nie geplant</p>

              <CalendarDays size={16} />
            </div>
          </div>
        </div>
      </Card>
    </NavLink>
  );
}
