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
  currentId: number;
  currentName: string;
  currentAmount: string;
  onItemEdited: () => void;
};

export default function EditItemDrawer({ currentId, currentName, currentAmount, onItemEdited }: Readonly<Props>) {
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
      .update({ name: newItemName })
      .eq('id', currentId)
      .select();

    if (data) {
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
            
            <DrawerClose>
              <Button className="w-full" onClick={editItem}>
                Add Item
              </Button>
            </DrawerClose>
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
