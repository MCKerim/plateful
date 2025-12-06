import { Button } from "../ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger,
} from "../ui/drawer";
import { Camera, Link, Plus } from "lucide-react";

type Props = {
  newRecipeClicked: () => void;
};

export default function AddNewRecipeDrawer({
  newRecipeClicked,
}: Readonly<Props>) {
  function renderButton(
    icon: any,
    label: string,
    onClick: () => void,
    description?: string
  ) {
    return (
      <Button variant="secondary" size="lg" onClick={onClick}>
        <div className="flex justify-start gap-4 w-full h-full items-center text-start">
          {icon}

          <div className="flex flex-col justify-start">
            <p>{label}</p>

            <p className="text-xs font-normal text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </Button>
    );
  }

  return (
    <Drawer>
      <DrawerTrigger className="p-2.5 fixed bottom-[5rem] right-[1rem] z-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:bg-plateful/90 active:scale-95">
        <Plus size={34} />
      </DrawerTrigger>

      <DrawerContent>
        <DrawerFooter className="gap-4 mb-8 mt-4">
          {renderButton(
            <Link />,
            "Rezept aus URL hinzufügen",
            () => {},
            "TikTok, YouTube, Instagram, Webseite"
          )}

          {renderButton(
            <Camera />,
            "Rezept aus Foto hinzufügen",
            () => {},
            "Scanne ein Rezeptbuch oder Gericht"
          )}

          {renderButton(<Plus />, "Neues Rezept erstellen", newRecipeClicked)}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
