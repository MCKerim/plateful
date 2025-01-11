import BottomNav from "../atoms/BottomNav";
import Header from "../atoms/Header";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Readonly<Props>) {
  return (
    <div className="w-full max-w-lg flex flex-col items-center m-auto">
      <Header />

      <div className="w-full flex gap-2 flex-col">{children}</div>

      <BottomNav />
    </div>
  );
}
