import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
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
    <OnboardingLayout
      nextButtonLabel="Haushalt erstellen"
      onNext={handleCreateHousehold}
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold">Erstelle dein Haushalt</h1>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
        <p className="text-gray-600 text-justify mb-8">
          Teile Rezepte und plannt gemeinsam Mahlzeiten in eurem Haushalt.{" "}
          <br />
          Nur eine Person pro Haushalt muss bezahlen.
        </p>

        <div className="grid w-full items-center gap-2">
          <Label htmlFor="name">Wie soll dein Haushalt heißen?</Label>

          <Input
            type="text"
            id="name"
            placeholder="z.B. Familie Müller"
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
          />
        </div>

        <Separator>
          <p className="italic">Ihr habt schon ein Haushalt?</p>
        </Separator>

        <NavLink to="/joinHousehold" className="w-full">
          <Button className="w-full" variant="secondary">
            Bestehendem Haushalt beitreten
          </Button>
        </NavLink>
      </div>
    </OnboardingLayout>
  );
}
