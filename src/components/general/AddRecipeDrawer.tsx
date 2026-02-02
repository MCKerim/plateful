import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { Drawer, DrawerContent, DrawerFooter, DrawerTrigger } from "../ui/drawer";
import { Camera, Link, Plus } from "lucide-react";
import { motion } from "motion/react";

type Props = {
  urlImportClicked: () => void;
  imageImportClicked: () => void;
  newRecipeClicked: () => void;
};

export default function AddNewRecipeDrawer({
  urlImportClicked,
  imageImportClicked,
  newRecipeClicked,
}: Readonly<Props>) {
  const { t } = useTranslation();

  function renderButton(
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    description?: string,
    disabled?: boolean
  ) {
    return (
      <Button variant="secondary" size="lg" onClick={onClick} disabled={disabled}>
        <div className="flex justify-start gap-4 w-full h-full items-center text-start">
          {icon}

          <div className="flex flex-col justify-start">
            <p className="second-font font-semibold">{label}</p>

            <p className="text-xs font-normal text-muted-foreground">{description}</p>
          </div>
        </div>
      </Button>
    );
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <motion.button
          className="p-2.5 fixed bottom-[5rem] right-[1rem] z-50 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg hover:bg-accent/90"
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Plus size={34} />
        </motion.button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerFooter className="gap-4 mb-8 mt-4">
          {renderButton(
            <Link />,
            t("addRecipeDrawer.importFromUrl.label"),
            urlImportClicked,
            t("addRecipeDrawer.importFromUrl.description")
          )}

          {renderButton(
            <Camera />,
            t("addRecipeDrawer.importFromImage.label"),
            imageImportClicked,
            t("addRecipeDrawer.importFromImage.description")
          )}

          {renderButton(<Plus />, t("addRecipeDrawer.createNewRecipe.label"), newRecipeClicked)}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
