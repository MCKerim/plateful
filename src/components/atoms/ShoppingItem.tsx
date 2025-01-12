import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import ItemMenu from "./ItemMenu";

type Props = {
  name: string;
  amount: number;
  bought: boolean;

  onClick: () => void;
};

export default function ShoppingItem({
  name,
  amount,
  bought,
  onClick,
}: Readonly<Props>) {
  return (
    <Card
      className={(bought ? "bg-gray-700" : "") + " w-full"}
      
    >
      <CardHeader className="px-4 py-2">
        <div className="flex" onClick={onClick}>
          <div className="flex-1">
            <CardTitle className="text-lg">{name}</CardTitle>
            <CardDescription style={{ margin: "0px" }}>
              {amount}
            </CardDescription>
          </div>
          <ItemMenu />
        </div>
      </CardHeader>
    </Card>
  );
}
