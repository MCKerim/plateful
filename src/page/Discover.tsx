import BottomNav from "@/components/atoms/BottomNav";
import Header from "@/components/atoms/Header";

export default function Discover() {
  return (
    <div className="w-full max-w-lg flex flex-col items-center m-auto">
      <Header />

      <div className="w-full flex gap-2 flex-col">
        <h1 className="text-2xl">Discover</h1>
      </div>

      <BottomNav />
    </div>
  );
}
