import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";

type Props = {
  name: string;
  description: string;
};

export default function RecipeCard({ name, description }: Readonly<Props>) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
