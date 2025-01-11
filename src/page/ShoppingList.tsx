import ShoppingItem from "@/components/atoms/ShoppingItem";

export default function ShoppingList() {
  return (
    <div className="w-full flex gap-2 flex-col">
      <ShoppingItem name="Apple" quantity={5} />
      <ShoppingItem name="Bannana" quantity={3} />
      <ShoppingItem name="Meat" quantity={500} />
      <ShoppingItem name="Pudding" quantity={2} />
    </div>
  );
}
