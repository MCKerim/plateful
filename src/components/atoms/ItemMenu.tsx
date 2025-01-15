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
import supabase from "@/utils/supabase";

type Props = {
  onItemAdded: () => void;
};

export default function AddNewItemDrawer({ onItemAdded }: Readonly<Props>) {
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");

  async function addItem() {
    if (!newItemName || !newItemAmount) {
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
    const amount = parseInt(newItemAmount);
    if (isNaN(amount)) return;

    const { data } = await supabase
      .from("shopping_list_items")
      .insert([
        { shopping_list_id: 1, item_id: itemId, amount: amount, bought: false },
      ])
      .select();

    if (data) {
      setNewItemAmount("");
      onItemAdded();
    }
  }

  return (
    <Drawer>
      <DrawerTrigger className="fixed bottom-20">
        <Button onClick={addItem}>
          Add Item
        </Button>
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
                type="number"
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
