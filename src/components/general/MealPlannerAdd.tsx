import { Plus } from "lucide-react";
import { Card } from "../ui/card";

type Props = {
  onClick: () => void;
};

export default function MealPlannerAdd({ onClick }: Readonly<Props>) {
  function handleClick() {
    onClick();
  }

  return (
    <Card className="h-[72px]">
      <button
        className="w-full h-full flex items-center justify-center text-muted-foreground"
        onClick={handleClick}
      >
        <Plus size={36} />
      </button>
    </Card>
  );
}
