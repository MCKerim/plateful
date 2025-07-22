import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

type Props = {
  questionNumber: number;
  maxQuestionNumber: number;
  question: string;
  answers: string[];
  selected?: string[];
  handleSelect: (option: string) => void;
  onComplete: () => void;
};

export default function SurveyLayout({
  questionNumber,
  maxQuestionNumber,
  question,
  answers,
  selected,
  handleSelect,
  onComplete,
}: Readonly<Props>) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-between w-screen h-screen max-w-xs py-10 mx-auto">
      <div className="flex flex-col w-full gap-8">
        <Progress value={(questionNumber / maxQuestionNumber) * 100} />

        <h1 className="mb-4 text-3xl font-bold text-center">
          {t(`questions.${question}.question`)}
        </h1>
      </div>

      <div className="flex flex-col w-full gap-4">
        {answers.map((option) => (
          <Button
            key={option}
            className="w-full rounded-lg"
            variant={selected?.includes(option) ? "default" : "secondary"}
            onClick={() => handleSelect(option)}
          >
            {t(`questions.${question}.${option}`)}
          </Button>
        ))}
      </div>

      <Button
        className="w-full h-12 text-base font-semibold rounded-full shadow-lg shadow-primary/20"
        onClick={onComplete}
      >
        Weiter
      </Button>
    </div>
  );
}
