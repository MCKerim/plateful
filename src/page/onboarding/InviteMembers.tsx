import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Link } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { NavLink } from "react-router";

export default function InviteMembers() {
  const [householdName, setHouseholdName] = useState("");

  function handleCreateHousehold() {
    const trimmedName = householdName.trim();
    if (!trimmedName) {
      alert("Bitte gib einen Namen für deinen Haushalt ein.");
      return;
    }
    console.log("Haushalt erstellt:", trimmedName);

    setHouseholdName("");
  }

  return (
    <div className="flex flex-col h-full w-full max-w-xs mx-auto py-10 gap-10">
      <h1 className="text-4xl font-bold mb-4 text-center">
        Lade Freunde oder Familie ein
      </h1>

      <div className="flex flex-col gap-4 w-full">
        <QRCodeSVG
          value="https://www.plateful.cloud/"
          size={256}
          imageSettings={{
            src: "/logo.png",
            height: 64,
            width: 64,
            excavate: true,
          }}
        />

        <Button className="w-full mt-4">
          <Link size={16} /> Link teilen
        </Button>

        <div className="flex gap-2 w-full">
          <Input placeholder="E-Mail-Adresse" />

          <Button>Senden</Button>
        </div>

        <NavLink to="/" className="w-full">
          <Button className="w-full">Weiter</Button>
        </NavLink>
      </div>
    </div>
  );
}
