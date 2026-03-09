import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import { useSupabase } from "@/utils/supabase";
import { SURVEY_QUESTIONS } from "@/page/onboarding/survey/SurveyQuestions";
import { useOnboardingTracking } from "@/hooks/analytics/useOnboardingTracking";

export default function SurveyStart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const { supabase } = useSupabase();
  const { trackScreenViewed } = useOnboardingTracking();

  useEffect(() => {
    trackScreenViewed("survey_start");
  }, []);

  const [resumeQuestion, setResumeQuestion] = useState<number | null>(null);

  useEffect(() => {
    async function checkResume() {
      if (!user) return;
      const { data } = await supabase
        .from("survey_answers")
        .select("question_number")
        .eq("user_id", user.id)
        .order("question_number", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const lastAnswered = data[0].question_number;
        if (lastAnswered < SURVEY_QUESTIONS.length) {
          setResumeQuestion(lastAnswered + 1);
        }
      }
    }
    checkResume();
  }, [user?.id]);

  const progressValue = resumeQuestion
    ? ((resumeQuestion - 1) / SURVEY_QUESTIONS.length) * 100
    : 0;

  return (
    <div className="flex flex-col items-center justify-between w-screen h-screen max-w-xs py-10 mx-auto">
      <div className="flex flex-col w-full gap-8">
        <Progress value={progressValue} />
      </div>

      <h1 className="mb-4 text-3xl font-bold text-center first-font">{t("surveyStart.title")}</h1>

      <div className="flex flex-col w-full gap-3">
        {resumeQuestion && (
          <Button
            className="second-font w-full h-12 text-base font-semibold rounded-full shadow-lg shadow-primary/20"
            onClick={() => navigate(`/survey/${resumeQuestion}`)}
          >
            {t("surveyStart.resumeButton")}
          </Button>
        )}
        <Button
          className="second-font w-full h-12 text-base font-semibold rounded-full shadow-lg shadow-primary/20"
          variant={resumeQuestion ? "secondary" : "default"}
          onClick={() => navigate("/survey/1")}
        >
          {resumeQuestion ? t("surveyStart.startOverButton") : t("surveyStart.nextButton")}
        </Button>
      </div>
    </div>
  );
}
