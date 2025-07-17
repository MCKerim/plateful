import BottomNav from "../atoms/BottomNav";
import Header from "../atoms/Header";

type Props = {
  headerButtons?: React.ReactNode;
  children?: React.ReactNode;
};

export default function Layout({ children, headerButtons }: Readonly<Props>) {
  return (
    <div className="w-full max-w-lg flex flex-col items-center m-auto min-h-screen">
      <Header buttons={headerButtons} />

      <div className="w-full flex gap-2 flex-col px-4 flex-1">
        {children}
      </div>

      <BottomNav />
    </div>
  );
}
