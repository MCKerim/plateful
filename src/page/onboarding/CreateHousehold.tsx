import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function CreateHousehold() {
  return (
    <div className="flex flex-col items-center justify-between h-screen w-screen max-w-xs mx-auto py-10">
      <h1 className="text-4xl font-bold mb-4 text-center">
        Erstelle dein Haushalt
      </h1>

      <p>
        Lade deine Familie oder Freunde ein, um gemeinsam zu kochen und zu
        planen.
      </p>

      <div className="grid w-full items-center gap-2">
        <Label htmlFor="name">Geb deinem Zuhasue ein name</Label>

        <Input type="text" id="name" placeholder="Familie" />
      </div>

      <div>
        <Button className="w-full">Familie/Freunde einladen</Button>

        <p className="text-muted-foreground text-sm">
          Geht auch noch später, müssen nichts bezahlen
        </p>
      </div>

      <Button className="w-full">Weiter</Button>

      <Separator className="my-2">
        <p className="italic">oder</p>
      </Separator>

      <Button className="w-full" variant="secondary">
        Trete einem Haushalt bei
      </Button>
    </div>
  );
}
