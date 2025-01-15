import Layout from "@/components/layout/Layout";
import ShoppingItem from "@/components/atoms/ShoppingItem";
import { useEffect, useState } from "react";
import supabase from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Item = {
  name: string;
  amount: number;
  bought: boolean;
};

export default function ShoppingList() {
  const [items, setItems] = useState<Item[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");

  useEffect(() => {
    getItems();
  }, []);

  async function getItems() {
    const { data } = await supabase.from("shopping_list_items").select(`
      id,
      amount,
      bought,
      item ( id, name )
    `);

    const newItems: Item[] = [];

    if (!data) {
      setItems(newItems);
      return;
    }

    data.forEach((shoppingListItem) => {
      const newItem: Item = {
        name: shoppingListItem.item.name,
        amount: shoppingListItem.amount,
        bought: shoppingListItem.bought,
      };
      newItems.push(newItem);
    });
    setItems(newItems);
  }

  async function addItem() {
    if (!newItemName || !newItemAmount) {
      return;
    }
    const { data } = await supabase
      .from("item")
      .insert([{ name: newItemName }])
      .select();

    setNewItemName("");

    if (data) {
      addToShoppingList(data[0].id);
    }
  }

  async function addToShoppingList(itemId: number) {
    const amount = parseInt(newItemAmount);
    if(isNaN(amount)) return;
    setNewItemAmount("");

    const { data } = await supabase
      .from("shopping_list_items")
      .insert([
        { shopping_list_id: 1, item_id: itemId, amount: amount, bought: true },
      ])
      .select();

    if (data) {
      getItems();
    }
  }

  function handleItemClick(index: number) {
    const newItems = [...items];
    newItems[index].bought = !newItems[index].bought;
    setItems(newItems);
  }

  return (
    <Layout>
      <h1 className="text-2xl">Shopping List</h1>
      {items.map((item, index) => (
        <ShoppingItem
          key={"item-" + index}
          name={item.name}
          amount={item.amount}
          bought={item.bought}
          onClick={() => handleItemClick(index)}
        />
      ))}

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
    </Layout>
  );
}
