import { Button } from "@/components/ui/button";
import { NavLink } from "react-router";

export default function Survey() {
  return (
    <div
      className="flex flex-col items-center justify-evenly h-screen"
    >
      <h1 className="text-4xl font-bold mb-4">Are you vegetarian?</h1>

      <p>No</p>


      <NavLink to="/signup">
        <Button>Yes</Button>
        <Button>No</Button>
      </NavLink>
    </div>
  );
}
