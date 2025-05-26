import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router";

const DIET_OPTIONS = ["Vegan", "Vegetarian", "Halal", "Kosher", "other"];

export default function Survey() {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelect = (option: string) => {
    setSelected((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  return (
    <div className="flex flex-col items-center justify-between h-screen w-screen max-w-xs mx-auto py-10">
      <h1 className="text-4xl font-bold mb-4 text-center">
        Do you follow a specific diet?
      </h1>

      <div className="flex flex-col gap-4 w-full">
        <p className="text-sm text-muted-foreground">Select all that apply:</p>
        {DIET_OPTIONS.map((option) => (
          <Button
            key={option}
            className="w-full"
            variant={selected.includes(option) ? "default" : "outline"}
            onClick={() => handleSelect(option)}
          >
            {option}
          </Button>
        ))}
      </div>

      <div className="w-full flex gap-2">
        <NavLink to="/value" className="w-1/2">
          <Button variant="secondary" className="w-full">
            Back
          </Button>
        </NavLink>

        <NavLink to="/createHousehold" className="w-full">
          <Button className="w-full">Next</Button>
        </NavLink>
      </div>
    </div>
  );
}
