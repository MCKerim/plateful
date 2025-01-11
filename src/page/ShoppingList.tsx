import BottomNav from "@/components/atoms/BottomNav";
import Header from "@/components/atoms/Header";
import ShoppingItem from "@/components/atoms/ShoppingItem";

export default function ShoppingList() {
  return (
    <div className="w-full max-w-lg flex flex-col items-center m-auto">
      <Header />

      <div className="w-full flex gap-2 flex-col">
        <h1 className="text-2xl">Shopping List</h1>
        <ShoppingItem name="Apple" quantity={5} />
        <ShoppingItem name="Bannana" quantity={3} />
        <ShoppingItem name="Meat" quantity={500} />
        <ShoppingItem name="Pudding" quantity={2} />
      </div>

      <BottomNav />
    </div>
  );
}
