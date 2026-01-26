import BottomNav from "../general/BottomNav";
import Header from "../general/Header";

type Props = {
  showHeader?: boolean;
  showFooter?: boolean;
  headerButtons?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
};

export default function Layout({
  showHeader = true,
  showFooter = true,
  children,
  headerButtons,
  footer,
}: Readonly<Props>) {
  return (
    <div className="flex flex-col items-center w-full max-w-lg min-h-screen m-auto">
      {showHeader && <Header buttons={headerButtons} />}

      <div className="flex flex-col flex-1 w-full gap-2 px-4 py-4">{children}</div>

      {footer ?? (showFooter && <BottomNav />)}
    </div>
  );
}
