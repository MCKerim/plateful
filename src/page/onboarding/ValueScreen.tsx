import { Button } from "@/components/ui/button";
import { NavLink } from "react-router";

export default function ValueScreen() {
  return (
    <div
      className="flex flex-col items-center justify-evenly h-screen"
    >
      <h1 className="text-4xl font-bold mb-4">Import Recipes</h1>

      <p>Use our AI-powered tool to import recipes from any website!</p>


      <NavLink to="/signup">
        <Button>Next</Button>
      </NavLink>
    </div>
  );
}
