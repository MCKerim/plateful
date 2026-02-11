import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { selectUser, setUser } from "@/redux/slices/userSlice";
import { useSupabase } from "@/utils/supabase";
import SurveyLayout from "@/components/layout/surveyLayout/SurveyLayout";
import { SURVEY_QUESTIONS } from "./SurveyQuestions";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function Survey() {
  const { supabase } = useSupabase();
  const { t } = useTranslation();
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

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
  }, [questionId, user?.id]);

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

  function goBack() {
    if (questionId === 1) {
      navigate("/survey");
    } else {
      navigate(`/survey/${questionId - 1}`);
    }
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
      toast.error(t("survey.errors.completeFailed"));
      return;
    }

    dispatch(setUser({ ...user, has_completed_survey: true }));
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
      onBack={goBack}
      showNextButton={SURVEY_QUESTIONS[questionId - 1].type !== "single" || selected.length > 0}
      twoColumns={SURVEY_QUESTIONS[questionId - 1].twoColumns}
    />
  );
}
