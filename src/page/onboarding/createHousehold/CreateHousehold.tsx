import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import supabase from "@/utils/supabase";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router";

export default function CreateHousehold() {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);

  const [householdName, setHouseholdName] = useState("");

  async function handleCreateHousehold() {
    if (!user) {
      return;
    }

    const trimmedName = householdName.trim();
    if (!trimmedName) {
      alert("Bitte gib einen Namen für deinen Haushalt ein.");
      return;
    }

    const { data, error } = await supabase
      .from("household")
      .insert({ name: trimmedName })
      .select();

    if (error || !data) {
      alert("Fehler beim Erstellen des Haushalts: " + error?.message);
      return;
    }

    if (data) {
      setHouseholdName("");

      // set household id for user
      const { error: updateError } = await supabase
        .from("users")
        .update({ household_id: data[0].id })
        .eq("id", user.id);

      if (updateError) {
        alert(
          "Fehler beim Aktualisieren des Haushalts: " + updateError.message
        );
        return;
      }
      
      navigate("/inviteMembers");
    }
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

        <NavLink to="/joinHousehold" className="w-full">
          <Button className="w-full" variant="secondary">
            Bestehendem Haushalt beitreten
          </Button>
        </NavLink>
      </div>
    </div>
  );
}
