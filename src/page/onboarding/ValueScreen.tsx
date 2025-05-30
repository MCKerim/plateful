import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import supabase from "@/utils/supabase";
import { useNavigate } from "react-router";

export default function ValueScreen() {
  const user = useAppSelector(selectUser);
  const navigate = useNavigate();

  async function completeValueScreen() {
    if (!user) {
      return;
    }

    const { error } = await supabase
      .from("users")
      .update({ has_seen_value_screens: true })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating user:", error);
      alert("An error occurred while saving your progress. Please try again.");
      return;
    }

    navigate("/survey");
  }

  return (
    <div className="flex flex-col items-center justify-between h-screen w-screen max-w-xs mx-auto py-10">
      <h1 className="text-4xl font-bold mb-4 text-center">
        Import Recipes <br />
        <span className="italic text-2xl">from everywhere</span>
      </h1>

      <p>Use our AI-powered tool to import recipes from any website or app!</p>
      
      <Button className="w-full" onClick={completeValueScreen}>
        Got it!
      </Button>
    </div>
  );
}
