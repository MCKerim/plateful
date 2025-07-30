import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import supabase from "@/utils/supabase";
import SurveyLayout from "@/components/layout/surveyLayout/SurveyLayout";
import { SURVEY_QUESTIONS } from "./SurveyQuestions";
import { useTranslation } from "react-i18next";

export default function Survey() {
  const { t } = useTranslation();
  const user = useAppSelector(selectUser);
  const navigate = useNavigate();

  const params = useParams<{ questionId: string }>();
  const questionId = parseQuestionId();

  const [selected, setSelected] = useState<string[]>([]);

  function parseQuestionId() {
    const id = parseInt(params.questionId ?? "1", 10);
    return isNaN(id) ? 1 : Math.max(1, Math.min(id, SURVEY_QUESTIONS.length));
  }

  const handleSelect = (option: string) => {
    const question = SURVEY_QUESTIONS[questionId - 1];
    if (question.type === "single") {
      setSelected([option]);
    } else {
      setSelected((prev) =>
        prev.includes(option)
          ? prev.filter((item) => item !== option)
          : [...prev, option]
      );
    }
  };

  async function onComplete() {
    if (!user) {
      return;
    }

    if (selected.length === 0) {
      alert("Please select at least one option before proceeding.");
      return;
    }

    const QUESTION_KEY = SURVEY_QUESTIONS[questionId - 1].questionKey;
    const translatedOptions = selected.map((option) =>
      t(`questions.${QUESTION_KEY}.${option}`)
    );

    await supabase.from("survey_answears").insert([
      {
        question: t(`questions.${QUESTION_KEY}.question`),
        user_id: user.id,
        selected_options: translatedOptions.join(", "),
        question_number: questionId,
      },
    ]);

    setSelected([]);

    goToNext();
  }

  function goToNext() {
    if (questionId === SURVEY_QUESTIONS.length) {
      completeSurvey();
      return;
    }

    navigate(`/survey/${questionId + 1}`);
  }

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

  return (
    <SurveyLayout
      questionNumber={questionId}
      maxQuestionNumber={SURVEY_QUESTIONS.length}
      question={SURVEY_QUESTIONS[questionId - 1].questionKey}
      answers={SURVEY_QUESTIONS[questionId - 1].optionKeys}
      selected={selected}
      handleSelect={handleSelect}
      onComplete={onComplete}
    />
  );
}
