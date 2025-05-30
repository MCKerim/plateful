import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import supabase from "@/utils/supabase";

const DIET_OPTIONS = ["Vegan", "Vegetarian", "Halal", "Kosher", "other"];

export default function Survey() {
  const user = useAppSelector(selectUser);
  const navigate = useNavigate();

  const [selected, setSelected] = useState<string[]>([]);

  async function completeSurvey() {
    if (!user) {
      return;
    }

    const { error } = await supabase
      .from("users")
      .update({ has_completed_survey: true })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating user:", error);
      alert("An error occurred while saving your progress. Please try again.");
      return;
    }

    navigate("/createhousehold");
  }

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
        <Button variant="secondary" className="w-1/2">
          Back
        </Button>

        <Button className="w-full" onClick={completeSurvey}>
          Next
        </Button>
      </div>
    </div>
  );
}
