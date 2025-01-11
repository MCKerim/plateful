import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

export default function BottomNav() {
  return (
    <>
      <Separator className="mt-4" />
      <div className="flex justify-between w-full gap-1">
        <Button className="w-full">1</Button>
        <Button className="w-full">2</Button>
        <Button className="w-full">3</Button>
        <Button className="w-full">4</Button>
      </div>
    </>
  );
}
