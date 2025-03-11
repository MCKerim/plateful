import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import EditItemDrawer from "./EditItemDrawer";

type Props = {
  id: number;
  name: string;
  amount: string;
  bought: boolean;

  onClick: () => void;
  onEdit: () => void;
};

export default function ShoppingItem({
  id,
  name,
  amount,
  bought,
  onClick,
  onEdit,
}: Readonly<Props>) {
  return (
    <Card
      className={(bought ? "bg-gray-700" : "") + " w-full"}
    >
      <CardHeader className="px-4 py-2">
        <div className="flex">
          <div className="flex-1" onClick={onClick}>
            <CardTitle className="text-lg">{name}</CardTitle>
            <CardDescription style={{ margin: "0px" }}>
              {amount}
            </CardDescription>
          </div>
          <div className="flex items-center pl-2">
            <EditItemDrawer currentId={id} currentName={name} currentAmount={amount} onItemEdited={onEdit} />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
