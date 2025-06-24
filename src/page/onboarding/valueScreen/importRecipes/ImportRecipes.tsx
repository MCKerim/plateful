import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import supabase from "@/utils/supabase";
import { useNavigate } from "react-router";

export default function importRecipes() {
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
    <div className="flex flex-col items-center justify-between h-screen w-screen max-w-xs mx-auto py-10 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          Import Recipes <br />
          <span className="italic text-2xl">from everywhere</span>
        </h1>

        <p className="text-gray-600 mb-8">
          Just Share to Plateful from any app, and we’ll save it for you.
        </p>
      </div>

      {/* Phone Screen Mockup */}
      <div className="w-64 bg-gray-900 rounded-[2.2rem] p-2 shadow-2xl">
        <img
          src="/importRecipesScreenshot.png"
          alt="Mobile app interface screenshot"
          className="object-cover rounded-[1.8rem]"
        />
      </div>

      <div className="w-full">
        <Button className="w-full rounded-full" onClick={completeValueScreen}>
          Got it!
        </Button>
      </div>
    </div>
  );
}
