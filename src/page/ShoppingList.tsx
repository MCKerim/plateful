import Layout from "@/components/layout/Layout";
import ShoppingItem from "@/components/atoms/ShoppingItem";
import { useEffect, useState } from "react";
import supabase from "@/utils/supabase";
import { Button } from "@/components/ui/button";

type Item = {
  name: string;
  amount: number;
  bought: boolean;
};

export default function ShoppingList() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    getItems();
  }, []);

  async function getItems() {
    const { data } = await supabase.from("shopping_list_items").select();
    const newItems: Item[] = [];

    if (!data) {
      setItems(newItems);
      return;
    }

    data.map((item) => {
      const newItem: Item = {
        name: item.item_id,
        amount: item.amount,
        bought: item.bought,
      };
      newItems.push(newItem);
    });
    setItems(newItems);
  }

  async function addItem() {
    const { data } = await supabase
      .from("shopping_list_items")
      .insert([{ shopping_list_id: 1, item_id: 1, amount: 30, bought: true }])
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
      <div className="flex justify-end">
        <Button className="w-full" onClick={addItem}>
          Add Item
        </Button>
      </div>
    </Layout>
  );
}
