import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NavLink } from "react-router";

export default function JoinHousehold() {
  return (
    <div className="relative flex flex-col items-center justify-between h-screen px-4 py-6 overflow-hidden">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Haushalt beitreten</h1>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
        <p className="text-gray-600 text-justify">
          Lass dir einen Einladungslink zuschicken oder scanne den QR-Code einer
          Person aus deinem Haushalt, um beizutreten.
        </p>

        <Separator>
          <p className="italic">oder</p>
        </Separator>

        <NavLink to="/createHousehold" className="w-full">
          <Button className="w-full" variant="secondary">
            Erstelle einen neuen Haushalt
          </Button>
        </NavLink>
      </div>

      <div></div>
    </div>
  );
}
