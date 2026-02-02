import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useSupabase } from "@/utils/supabase";
import { useTranslation } from "react-i18next";

type Props = {
  currentId: number;
  currentName: string;
  currentAmount: string;
  onItemEdited: () => void;
};

export default function EditItemDrawer({
  currentId,
  currentName,
  currentAmount,
  onItemEdited,
}: Readonly<Props>) {
  const { supabase } = useSupabase();
  const { t } = useTranslation();
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");

  useEffect(() => {
    setNewItemName(currentName);
    setNewItemAmount(currentAmount);
  }, [currentName, currentAmount]);

  async function editItem() {
    if (!newItemName) {
      return;
    }

    const { data: itemData } = await supabase
      .from("item")
      .update({ name: newItemName })
      .eq("id", currentId)
      .select();

    const { data: amountData } = await supabase
      .from("shopping_list_items")
      .update({ amount: newItemAmount })
      .eq("item_id", currentId)
      .select();

    if (itemData && amountData) {
      onItemEdited();
    }
  }

  return (
    <Drawer>
      <DrawerTrigger>
        <Button variant="outline">E</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("editItem.title")}</DrawerTitle>
        </DrawerHeader>
        <DrawerFooter>
          <div className="flex flex-col mt-4 space-y-2">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="itemInput">{t("editItem.itemName")}</Label>
              <Input
                type="text"
                id="itemInput"
                placeholder={t("editItem.itemNamePlaceholder")}
                value={newItemName}
                autoFocus
                onChange={(e) => setNewItemName(e.target.value)}
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="amountInput">{t("editItem.amount")}</Label>
              <Input
                type="text"
                id="amountInput"
                placeholder={t("editItem.amountPlaceholder")}
                value={newItemAmount}
                onChange={(e) => setNewItemAmount(e.target.value)}
              />
            </div>

            <DrawerClose>
              <Button className="w-full" onClick={editItem}>
                {t("editItem.editButton")}
              </Button>
            </DrawerClose>
          </div>
          <DrawerClose>
            <Button variant="outline" className="w-full">
              {t("common.cancel")}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
