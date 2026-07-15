import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { Drawer, DrawerContent, DrawerFooter, DrawerTrigger } from "../ui/drawer";
import { Camera, FolderPlus, Link, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

type Props = {
  urlImportClicked: () => void;
  imageImportClicked: () => void;
  newRecipeClicked: () => void;
  newCollectionClicked?: () => void;
};

export default function AddNewRecipeDrawer({
  urlImportClicked,
  imageImportClicked,
  newRecipeClicked,
  newCollectionClicked,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  function renderButton(
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    description?: string,
    disabled?: boolean
  ) {
    return (
      <Button
        variant="secondary"
        size="lg"
        onClick={() => {
          setOpen(false);
          onClick();
        }}
        disabled={disabled}
      >
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
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <motion.button
          type="button"
          aria-label={t("addRecipeDrawer.open")}
          className="p-2.5 fixed bottom-[5rem] right-[1rem] z-50 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg"
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
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

          {newCollectionClicked &&
            renderButton(
              <FolderPlus />,
              t("addRecipeDrawer.createNewCollection.label"),
              newCollectionClicked
            )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
