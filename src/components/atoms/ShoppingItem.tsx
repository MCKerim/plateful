import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";

type Props = {
  name: string;
  quantity: number;
};

export default function ShoppingItem({ name, quantity }: Readonly<Props>) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{quantity}</CardDescription>
      </CardHeader>
    </Card>
  );
}
