import { Button } from "../ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { BadgePlus, Camera, Link, Plus } from "lucide-react";

type Props = {
  newRecipeClicked: () => void;
};

export default function AddNewRecipeDrawer({
  newRecipeClicked,
}: Readonly<Props>) {
  return (
    <Drawer>
      <DrawerTrigger className="p-2.5 fixed bottom-[5rem] right-[1rem] z-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:bg-plateful/90 active:scale-95">
        <Plus size={34} />
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Rezept hinzufügen</DrawerTitle>

          <DrawerDescription>
            Wie möchtest du das Rezept hinzufügen?
          </DrawerDescription>
        </DrawerHeader>

        <DrawerFooter className="gap-4 mb-10">
          <Button variant="secondary" size="lg" disabled>
            <Link />
            aus URL hinzufügen
          </Button>

          <Button variant="secondary" size="lg" disabled>
            <Camera />
            aus Foto hinzufügen
          </Button>

          <Button variant="secondary" size="lg" onClick={newRecipeClicked}>
            <BadgePlus />
            Neues Rezept erstellen
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
