import supabase from "@/utils/supabase";
import { ModeToggle } from "../mode-toggle";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";

export default function Header() {
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error while sign out: ", error);
    }
  };

  return (
    <>
      <div style={{ height: "64px" }}></div>

      <div className="w-full max-w-lg fixed top-0 pt-2 bg-background">
        <div className="flex justify-between w-full items-center px-2">
          <h1 className="font-bold text-2xl">Plateful</h1>
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
          <ModeToggle />
        </div>

        <Separator className="mt-2" />
      </div>
    </>
  );
}
