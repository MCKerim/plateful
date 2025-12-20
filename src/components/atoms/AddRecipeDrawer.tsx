import { Button } from "../ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger,
} from "../ui/drawer";
import { Camera, Link, Plus } from "lucide-react";

type Props = {
  urlImportClicked: () => void;
  newRecipeClicked: () => void;
};

export default function AddNewRecipeDrawer({
  urlImportClicked,
  newRecipeClicked,
}: Readonly<Props>) {
  function renderButton(
    icon: any,
    label: string,
    onClick: () => void,
    description?: string,
    disabled?: boolean
  ) {
    return (
      <Button
        variant="secondary"
        size="lg"
        onClick={onClick}
        disabled={disabled}
      >
        <div className="flex justify-start gap-4 w-full h-full items-center text-start">
          {icon}

          <div className="flex flex-col justify-start">
            <p className="second-font">{label}</p>

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
      <DrawerTrigger className="p-2.5 fixed bottom-[5rem] right-[1rem] z-50 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:bg-plateful/90 active:scale-95">
        <Plus size={34} />
      </DrawerTrigger>

      <DrawerContent>
        <DrawerFooter className="gap-4 mb-8 mt-4">
          {renderButton(
            <Link />,
            "Rezept aus URL hinzufügen",
            urlImportClicked,
            "TikTok, YouTube, Instagram, Webseite"
          )}

          {renderButton(
            <Camera />,
            "Rezept aus Foto hinzufügen",
            () => {},
            "Scanne ein Rezeptbuch oder Gericht",
            true
          )}

          {renderButton(<Plus />, "Neues Rezept erstellen", newRecipeClicked)}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
