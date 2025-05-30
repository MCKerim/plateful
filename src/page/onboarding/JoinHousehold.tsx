import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NavLink } from "react-router";

export default function JoinHousehold() {
  return (
        <div className="flex flex-col h-full w-full max-w-xs mx-auto py-10 gap-10">
      <h1 className="text-4xl font-bold mb-4 text-center">Haushalt beitreten</h1>

      <p>
        Lass dir ein Einladungslink oder einen QR-Code von der Person geben, die den Haushalt erstellt hat.
      </p>

      <div className="flex flex-col gap-4 w-full">
        <Separator>
          <p className="italic">oder</p>
        </Separator>

        <NavLink to="/createHousehold" className="w-full">
          <Button className="w-full" variant="secondary">Neues Haushalt erstellen</Button>
        </NavLink>
      </div>
    </div>
  );
}
