import { Button } from "@/components/ui/button";
import { NavLink } from "react-router";

export default function ValueScreen() {
  return (
    <div className="flex flex-col items-center justify-between h-screen w-screen max-w-xs mx-auto py-10">
      <h1 className="text-4xl font-bold mb-4 text-center">
        Import Recipes <br />

        <span className="italic text-2xl">from everywhere</span>
      </h1>

      <p>Use our AI-powered tool to import recipes from any website or app!</p>

      <NavLink to="/survey" className="w-full">
        <Button className="w-full">Got it!</Button>
      </NavLink>
    </div>
  );
}
