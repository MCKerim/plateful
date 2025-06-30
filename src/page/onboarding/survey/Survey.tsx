import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import supabase from "@/utils/supabase";
import SurveyLayout from "@/components/layout/surveyLayout/SurveyLayout";

const DIET_OPTIONS = ["Vegan", "Vegetarisch", "Halal", "Kosher", "Sonstiges"];

export default function Survey() {
  const user = useAppSelector(selectUser);
  const navigate = useNavigate();
  const params = useParams<{ questionId: string }>();
  const questionId = params.questionId ?? "1";

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
    <SurveyLayout
      question={"Verfolgst du eine spezielle Diät?" + questionId}
      answers={DIET_OPTIONS}
      selected={selected}
      handleSelect={handleSelect}
      onComplete={completeSurvey}
    />
  );
}
