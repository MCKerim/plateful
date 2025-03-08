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
import supabase from "@/utils/supabase";

type Props = {
  currentName: string;
  currentAmount: string;
  onItemEdited: () => void;
};

export default function EditItemDrawer({ currentName, currentAmount, onItemEdited }: Readonly<Props>) {
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

    const { data } = await supabase
      .from("item")
      .insert([{ name: newItemName }])
      .select();

    if (data) {
      setNewItemName("");
      addToShoppingList(data[0].id);
    }
  }

  async function addToShoppingList(itemId: number) {
    const { data } = await supabase
      .from("shopping_list_items")
      .insert([
        {
          shopping_list_id: 1,
          item_id: itemId,
          amount: newItemAmount,
          bought: false,
        },
      ])
      .select();

    if (data) {
      setNewItemAmount("");
      onItemEdited();
    }
  }

  function resetForm() {
    setNewItemName(currentName);
    setNewItemAmount(currentAmount);
  }

  return (
    <Drawer>
      <DrawerTrigger>
        <Button variant="outline">E</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit Item</DrawerTitle>
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
                autoFocus
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

            <Button className="w-full" onClick={editItem}>
              Add Item
            </Button>
          </div>
          <DrawerClose>
            <Button variant="outline" className="w-full" onClick={resetForm}>
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
