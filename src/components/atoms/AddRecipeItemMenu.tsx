import { useState } from "react";
import { Button } from "../ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useTranslation } from "react-i18next";

type Props = {
  onItemAdded: (name: string, amount: string) => void;
};

export default function AddRecipeItemMenu({ onItemAdded }: Readonly<Props>) {
  const { t } = useTranslation();
  
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");

  async function addItem() {
    if (!newItemName) {
      return;
    }

    setNewItemName("");
    setNewItemAmount("");

    onItemAdded(newItemName, newItemAmount);
  }

  return (
    <Drawer>
      <DrawerTrigger>
        <Button className="w-full" variant="secondary" onClick={addItem}>{t("addIngredient")}</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add new Item</DrawerTitle>
          <DrawerDescription>To Kerims shopping List</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <div className="flex flex-col space-y-2 mt-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="itemInput">Item name</Label>
              <Input
                type="text"
                id="itemInput"
                placeholder="Appel"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="amountInput">Amount</Label>
              <Input
                type="text"
                id="amountInput"
                placeholder="5"
                value={newItemAmount}
                onChange={(e) => setNewItemAmount(e.target.value)}
              />
            </div>

            <Button className="w-full" onClick={addItem}>
              Add Item
            </Button>
          </div>
          <DrawerClose>
            <Button variant="outline" className="w-full">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
