import { NavLink } from "react-router";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";

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

  return (
    <NavLink to={`/recipe/${id}`} className="w-full">
      <Card>
        <img
          src={
            "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
          }
          alt="Recipe"
          className="h-full w-full rounded-md object-cover"
        />

        <div>
          <div className="flex justify-between bg-blue-400">
            <h1 className="font-bold text-lg">{name}</h1>

            <div>Stars</div>
          </div>

          {description && (
            <div className="bg-orange-400">
              <p className="text-xs">{truncatedDescription}</p>
            </div>
          )}

          <div className="flex justify-between bg-red-400">
            <div>Tags</div>

            <div>vor 2 Tagen</div>
          </div>
        </div>
      </Card>
    </NavLink>
  );
}
