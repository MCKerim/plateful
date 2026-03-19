import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import { useSupabase } from "@/utils/supabase";
import SurveyLayout from "@/components/layout/surveyLayout/SurveyLayout";
import { SURVEY_QUESTIONS } from "./SurveyQuestions";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useOnboardingTracking } from "@/hooks/analytics/useOnboardingTracking";

// Interleaved navigation: questions that exit to a value screen instead of the next question
const NEXT_AFTER_QUESTION: Record<number, string> = {
  4: "/values/4", // After "Wie oft kochst du?" → Planner value screen
  7: "/values/3", // After "Sonstige Abneigungen?" → AI Chef value screen
  9: "/values/2", // After "Wie organisierst du Rezepte?" → Import Recipes value screen
};

const PREV_BEFORE_QUESTION: Record<number, string> = {
  1: "/values/1", // Back from first question → Emotional Hook
  5: "/values/4", // Back from "Welche Ernährungsweise?" → Planner value screen
  8: "/values/3", // Back from "Wo findest du Rezepte?" → AI Chef value screen
};

export default function Survey() {
  const { supabase } = useSupabase();
  const { t } = useTranslation();
  const user = useAppSelector(selectUser);
  const navigate = useNavigate();
  const { trackSurveyAnswered } = useOnboardingTracking();

  const params = useParams<{ questionId: string }>();
  const questionId = parseQuestionId();

  const [selected, setSelected] = useState<string[]>([]);

  function parseQuestionId() {
    const id = Number.parseInt(params.questionId ?? "1", 10);
    return Number.isNaN(id) ? 1 : Math.max(1, Math.min(id, SURVEY_QUESTIONS.length));
  }

  useEffect(() => {
    async function loadExistingAnswer() {
      if (!user) return;
      const { data } = await supabase
        .from("survey_answers")
        .select("selected_options")
        .eq("user_id", user.id)
        .eq("question_number", questionId)
        .maybeSingle();

      if (data?.selected_options && Array.isArray(data.selected_options)) {
        setSelected(data.selected_options as string[]);
      } else {
        setSelected([]);
      }
    }
    loadExistingAnswer();
  }, [questionId, user, supabase]);

  const handleSelect = async (option: string) => {
    const question = SURVEY_QUESTIONS[questionId - 1];
    if (question.type === "single") {
      setSelected([option]);
      await handleSingleQuestionComplete(option);
    } else {
      setSelected((prev) =>
        prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
      );
    }
  };

  async function handleSingleQuestionComplete(selectedOption: string) {
    if (!user) {
      return;
    }

    const QUESTION_KEY = SURVEY_QUESTIONS[questionId - 1].questionKey;

    const { error } = await supabase.from("survey_answers").upsert(
      [
        {
          question: QUESTION_KEY,
          user_id: user.id,
          selected_options: [selectedOption],
          question_number: questionId,
        },
      ],
      {
        onConflict: "user_id,question_number",
      }
    );

    if (error) {
      console.error("Error saving survey answer:", error);
      toast.error(t("survey.errors.saveFailed"));
      return;
    }

    trackSurveyAnswered({
      question_number: questionId,
      question_key: QUESTION_KEY,
      selected_options: [selectedOption],
    });

    setSelected([]);
    goToNext();
  }

  async function onComplete() {
    if (!user) {
      return;
    }

    if (selected.length === 0) {
      toast.error(t("survey.errors.selectOption"));
      return;
    }

    const QUESTION_KEY = SURVEY_QUESTIONS[questionId - 1].questionKey;

    const { error } = await supabase.from("survey_answers").upsert(
      [
        {
          question: QUESTION_KEY,
          user_id: user.id,
          selected_options: selected,
          question_number: questionId,
        },
      ],
      {
        onConflict: "user_id,question_number",
      }
    );

    if (error) {
      console.error("Error saving survey answer:", error);
      toast.error(t("survey.errors.saveFailed"));
      return;
    }

    trackSurveyAnswered({
      question_number: questionId,
      question_key: QUESTION_KEY,
      selected_options: selected,
    });

    setSelected([]);
    goToNext();
  }

  function goToNext() {
    const valueRoute = NEXT_AFTER_QUESTION[questionId];
    if (valueRoute) {
      navigate(valueRoute);
      return;
    }

    navigate(`/survey/${questionId + 1}`);
  }

  function goBack() {
    const valueRoute = PREV_BEFORE_QUESTION[questionId];
    if (valueRoute) {
      navigate(valueRoute);
      return;
    }

    navigate(`/survey/${questionId - 1}`);
  }

  return (
    <SurveyLayout
      questionNumber={questionId}
      maxQuestionNumber={SURVEY_QUESTIONS.length}
      question={SURVEY_QUESTIONS[questionId - 1].questionKey}
      answers={SURVEY_QUESTIONS[questionId - 1].optionKeys}
      selected={selected}
      handleSelect={handleSelect}
      onComplete={onComplete}
      onBack={goBack}
      showNextButton={SURVEY_QUESTIONS[questionId - 1].type !== "single" || selected.length > 0}
      twoColumns={SURVEY_QUESTIONS[questionId - 1].twoColumns}
    />
  );
}
