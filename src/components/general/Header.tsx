import { Settings } from "lucide-react";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { NavLink } from "react-router";
import { useSafeArea } from "@/hooks/useSafeArea";

type Props = {
  buttons?: React.ReactNode;
};

export default function Header({ buttons }: Readonly<Props>) {
  const { top } = useSafeArea();

  return (
    <>
      <div style={{ height: `${38 + top}px` }}></div>

      <div
        className="fixed top-0 z-40 w-full max-w-lg bg-background"
        style={{ paddingTop: `calc(0.25rem + ${top}px)` }}
      >
        <div className="flex items-center justify-between w-full px-2">
          <div className="flex items-center gap-1">
            <h1 className="text-xl font-bold first-font">Plateful</h1>

            <div className="text-xs font-bold bg-accent text-accent-foreground py-0.5 px-2 rounded-full">
              Beta
            </div>
          </div>

          <div className="flex">
            {buttons}

            <NavLink to="/settings">
              <Button variant="ghost" size="icon">
                <Settings />
              </Button>
            </NavLink>
          </div>
        </div>

        <Separator />
      </div>
    </>
  );
}
