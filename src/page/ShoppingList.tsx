import Layout from "@/components/layout/Layout";
import ShoppingItem from "@/components/atoms/ShoppingItem";

export default function ShoppingList() {
  return (
    <Layout>
      <h1 className="text-2xl">Shopping List</h1>
      <ShoppingItem name="Apple" quantity={5} />
      <ShoppingItem name="Bannana" quantity={3} />
      <ShoppingItem name="Meat" quantity={500} />
      <ShoppingItem name="Pudding" quantity={2} />
    </Layout>
  );
}
