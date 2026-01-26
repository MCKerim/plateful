import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

export default function SurveyStart() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-between w-screen h-screen max-w-xs py-10 mx-auto">
      <div className="flex flex-col w-full gap-8">
        <Progress value={0} />
      </div>

      <h1 className="mb-4 text-3xl font-bold text-center first-font">{t("surveyStart.title")}</h1>

      <Button
        className="second-font w-full h-12 text-base font-semibold rounded-full shadow-lg shadow-primary/20"
        onClick={() => navigate("/survey/1")}
      >
        {t("surveyStart.nextButton")}
      </Button>
    </div>
  );
}
