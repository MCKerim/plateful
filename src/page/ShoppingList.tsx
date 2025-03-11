import Layout from "@/components/layout/Layout";
import ShoppingItem from "@/components/atoms/ShoppingItem";
import { useEffect, useState } from "react";
import supabase from "@/utils/supabase";
import AddNewItemDrawer from "@/components/atoms/AddNewItemDrawer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";

type ShoppingListItem = {
  id: number;
  itemName: string;
  amount: string;
  bought: boolean;
};

export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);

  useEffect(() => {
    supabase
      .channel("shopping_list_items")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_list_items" },
        () => getItems()
      )
      .subscribe();

    return () => {
      supabase.channel("shopping_list_items").unsubscribe();
    };
  }, []);

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
        id: shoppingListItem.item.id,
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

  function GroupAndSortItems(items: ShoppingListItem[]): ShoppingListItem[] {
    console.log("UnItems: ", items);
    const groupedItems: ShoppingListItem[] = [];

    items.forEach((item) => {
      const index = groupedItems.findIndex(
        (groupedItem) => groupedItem.itemName === item.itemName
      );

      if (index === -1) {
        groupedItems.push(item);
      } else {
        groupedItems[index].amount += ", " + item.amount;
      }
    });

    console.log("Grouped items: ", groupedItems);
    return groupedItems;
  }

  return (
    <Layout>
      <h1 className="text-2xl">Shopping List</h1>

      {items.filter((shoppingListItem) => !shoppingListItem.bought).length ===
        0 && (
        <Card className="w-full my-3">
          <CardHeader className="px-4 py-2">
            <div className="flex">
              <div className="flex-1">
                <CardDescription>No items in the list</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {GroupAndSortItems(items.filter((shoppingListItem) => !shoppingListItem.bought))
        .map((shoppingListItem, index) => (
          <ShoppingItem
            key={"item-" + index}
            id={shoppingListItem.id}
            name={shoppingListItem.itemName}
            amount={shoppingListItem.amount}
            bought={shoppingListItem.bought}
            onClick={() =>
              handleItemClick(shoppingListItem.id, shoppingListItem.bought)
            }
            onEdit={getItems}
          />
        ))}

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>Bought</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-2">
            {GroupAndSortItems(items.filter((shoppingListItem) => shoppingListItem.bought))
              .slice(0, 10)
              .map((shoppingListItem, index) => (
                <ShoppingItem
                  key={"item-" + index}
                  id={shoppingListItem.id}
                  name={shoppingListItem.itemName}
                  amount={shoppingListItem.amount}
                  bought={shoppingListItem.bought}
                  onClick={() =>
                    handleItemClick(
                      shoppingListItem.id,
                      shoppingListItem.bought
                    )
                  }
                  onEdit={getItems}
                />
              ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <AddNewItemDrawer onItemAdded={() => getItems()} />
    </Layout>
  );
}
