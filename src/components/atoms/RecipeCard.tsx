import { NavLink } from "react-router";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";

type Props = {
  id: number;
  name: string;
  description: string;
};

export default function RecipeCard({ id, name, description }: Readonly<Props>) {
  return (
    <NavLink to={`/recipe/${id}`} className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>{name}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </NavLink>
  );
}
