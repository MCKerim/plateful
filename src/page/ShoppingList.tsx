import Layout from "@/components/layout/Layout";
import ShoppingItem from "@/components/atoms/ShoppingItem";
import { useEffect, useState } from "react";
import supabase from "@/utils/supabase";
import AddNewItemDrawer from "@/components/atoms/ItemMenu";

type ShoppingListItem = {
  id: number;
  itemName: string;
  amount: number;
  bought: boolean;
};

export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);

  useEffect(() => {
    getItems();
  }, []);

  async function getItems() {
    const { data } = await supabase
      .from("shopping_list_items")
      .select(
        `
      id,
      amount,
      bought,
      item ( id, name )
    `
      )
      .order("created_at", { ascending: false });

    const newItems: ShoppingListItem[] = [];

    if (!data) {
      setItems(newItems);
      return;
    }

    data.forEach((shoppingListItem) => {
      const newItem: ShoppingListItem = {
        id: shoppingListItem.id,
        itemName: shoppingListItem.item.name,
        amount: shoppingListItem.amount,
        bought: shoppingListItem.bought,
      };
      newItems.push(newItem);
    });
    console.log("Items: ", newItems);
    setItems(newItems);
  }

  async function handleItemClick(shoppingListItemId: number, bought: boolean) {
    const { data } = await supabase
      .from("shopping_list_items")
      .update({ bought: !bought })
      .eq("id", shoppingListItemId)
      .select();

    if (data) {
      console.log("Item bought status updated: ", data);
      getItems();
    }
  }

  return (
    <Layout>
      <h1 className="text-2xl">Shopping List</h1>

      {items
        .filter((shoppingListItem) => !shoppingListItem.bought)
        .map((shoppingListItem, index) => (
          <ShoppingItem
            key={"item-" + index}
            name={shoppingListItem.itemName}
            amount={shoppingListItem.amount}
            bought={shoppingListItem.bought}
            onClick={() =>
              handleItemClick(shoppingListItem.id, shoppingListItem.bought)
            }
          />
        ))}

      <h2>Bought</h2>

      {items
        .filter((shoppingListItem) => shoppingListItem.bought)
        .slice(0, 10)
        .map((shoppingListItem, index) => (
          <ShoppingItem
            key={"item-" + index}
            name={shoppingListItem.itemName}
            amount={shoppingListItem.amount}
            bought={shoppingListItem.bought}
            onClick={() =>
              handleItemClick(shoppingListItem.id, shoppingListItem.bought)
            }
          />
        ))}

      <AddNewItemDrawer onItemAdded={() => getItems()} />
    </Layout>
  );
}
