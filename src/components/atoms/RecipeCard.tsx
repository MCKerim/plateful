import { NavLink } from "react-router";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";

type Props = {
  id: number;
  name: string;
  description: string;
};

export default function RecipeCard({ id, name, description }: Readonly<Props>) {
  const truncatedDescription =
    description.length > 100 ? description.slice(0, 100) + "..." : description;
  
  return (
    <NavLink to={`/recipe/${id}`} className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>{name}</CardTitle>
          <CardDescription>{truncatedDescription}</CardDescription>
        </CardHeader>
      </Card>
    </NavLink>
  );
}
