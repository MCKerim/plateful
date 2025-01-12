import BottomNav from "../atoms/BottomNav";
import Header from "../atoms/Header";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Readonly<Props>) {
  return (
    <div className="h-full w-full max-w-lg flex flex-col items-center m-auto">
      <Header />
      <div className="w-full flex gap-2 flex-col px-4">{children}</div>
      <BottomNav />
    </div>
  );
}
