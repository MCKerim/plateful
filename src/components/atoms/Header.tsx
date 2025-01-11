import { ModeToggle } from "../mode-toggle";
import { Separator } from "../ui/separator";

export default function Header() {
  return (
    <>
      <div className="flex justify-between w-full items-center mt-4">
        <h1 className="font-bold text-2xl">Plateful</h1>
        <ModeToggle />
      </div>
      <Separator className="mb-4 mt-2" />
    </>
  );
}
