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
  onPrevious?: () => void;
  onComplete: () => void;
};

export default function SurveyLayout({
  questionNumber,
  maxQuestionNumber,
  question,
  answers,
  selected,
  handleSelect,
  onPrevious,
  onComplete,
}: Readonly<Props>) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-between h-screen w-screen max-w-xs mx-auto py-10">
      <div className="flex flex-col gap-8 w-full">
        <Progress value={(questionNumber / maxQuestionNumber) * 100} />

        <h1 className="text-3xl font-bold mb-4 text-center">
          {t(`questions.${question}.question`)}
        </h1>
      </div>

      <div className="flex flex-col gap-4 w-full">
        {answers.map((option) => (
          <Button
            key={option}
            className="w-full"
            variant={selected?.includes(option) ? "default" : "outline"}
            onClick={() => handleSelect(option)}
          >
            {t(`questions.${question}.${option}`)}
          </Button>
        ))}
      </div>

      <div className="w-full flex gap-2">
        {onPrevious && (
          <Button variant="secondary" className="w-1/2" onClick={onPrevious}>
            Zurück
          </Button>
        )}

        <Button className="w-full" onClick={onComplete}>
          Weiter
        </Button>
      </div>
    </div>
  );
}
