import BottomNav from "../atoms/BottomNav";
import Header from "../atoms/Header";

type Props = {
  headerButtons?: React.ReactNode;
  children?: React.ReactNode;
};

export default function Layout({ children, headerButtons }: Readonly<Props>) {
  return (
    <div className="flex flex-col items-center w-full max-w-lg min-h-screen m-auto">
      <Header buttons={headerButtons} />

      <div className="flex flex-col flex-1 w-full gap-2 px-4">
        {children}
      </div>

      <BottomNav />
    </div>
  );
}
