import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useNavigate } from "react-router";

export default function CreateHousehold() {
  const navigate = useNavigate();
  const [householdName, setHouseholdName] = useState("");

  function handleCreateHousehold() {
    const trimmedName = householdName.trim();
    if (!trimmedName) {
      alert("Bitte gib einen Namen für deinen Haushalt ein.");
      return;
    }
    console.log("Haushalt erstellt:", trimmedName);

    setHouseholdName("");
    navigate("/inviteMembers");
  }

  return (
    <div className="flex flex-col h-full w-full max-w-xs mx-auto py-10 gap-10">
      <h1 className="text-4xl font-bold mb-4 text-center">Dein Haushalt</h1>

      <p>
        Speicher gemeinsame Rezepte, planne eure Mahlzeiten und viel mehr! Nur
        eine Person pro Haushalt muss bezahlen.
      </p>

      <div className="flex flex-col gap-4 w-full">
        <div className="grid w-full items-center gap-2">
          <Label htmlFor="name">Wie soll euer Haushalt heißen?</Label>

          <Input
            type="text"
            id="name"
            placeholder="z.B. Familie Müller"
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
          />
        </div>

        <Button className="w-full" onClick={handleCreateHousehold}>
          Haushalt erstellen
        </Button>
      </div>

      <div className="flex flex-col gap-4 w-full">
        <Separator>
          <p className="italic">oder</p>
        </Separator>

        <Button className="w-full" variant="secondary">
          Bestehendem Haushalt beitreten
        </Button>
      </div>
    </div>
  );
}
