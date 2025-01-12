import Layout from "@/components/layout/Layout";
import ShoppingItem from "@/components/atoms/ShoppingItem";
import { useState } from "react";

export default function ShoppingList() {
  const [items, setItems] = useState([
    { name: "Milk", amount: 1, bought: false },
    { name: "Bread", amount: 2, bought: false },
    { name: "Eggs", amount: 12, bought: false },
    { name: "Butter", amount: 1, bought: false },
    { name: "Cheese", amount: 1, bought: false },
    { name: "Apples", amount: 6, bought: false },
    { name: "Bananas", amount: 6, bought: false },
    { name: "Oranges", amount: 6, bought: false },
    { name: "Pasta", amount: 1, bought: false },
    { name: "Rice", amount: 1, bought: false },
  ]);

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
    </Layout>
  );
}
