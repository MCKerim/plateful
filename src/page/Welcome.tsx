import { Button } from "@/components/ui/button";
import { NavLink } from "react-router";

export default function Welcome() {
  function featureItem(text: string) {
    return (
      <div className="border-2 border-primary rounded-lg py-2 px-4">
        <p>{text}</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-evenly h-screen"
    >
      <h1 className="text-4xl font-bold mb-4">Welcome to Plateful!</h1>

      <div className="flex flex-col gap-2">
        {featureItem("AI Recipes")}
        {featureItem("Import from everywhere")}
        {featureItem("Plan your meals and your shopping list")}
      </div>

      <NavLink to="/signup">
        <Button>Get Started!</Button>
      </NavLink>
    </div>
  );
}
