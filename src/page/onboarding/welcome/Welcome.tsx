import { Button } from "@/components/ui/button";
import { NavLink } from "react-router";

export default function Welcome() {
  function featureItem(text: string) {
    return (
      <div className="text-md font-semibold rounded-lg py-2 px-4">
        <p>- {text}</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-evenly h-screen px-4"
      style={{ backgroundColor: "#abff9b" }}
    >
      <div className="text-center text-4xl font-bold mb-4">
        <h1 className="text-4xl">
          Congratulations, <br />
        </h1>

        <h2 className="text-xl">smart food planning starts now!</h2>
      </div>

      <div className="flex flex-col">
        {featureItem("Create recipes with AI")}
        {featureItem("Import from everywhere")}
        {featureItem("Plan your meals and your shopping list")}
      </div>

      <NavLink
        to="/signup"
        className={"w-full max-w-sm shadow-lg shadow-primary/20"}
      >
        <Button className="w-full rounded-full h-12 font-semibold text-base">
          Get Started!
        </Button>
      </NavLink>
    </div>
  );
}
