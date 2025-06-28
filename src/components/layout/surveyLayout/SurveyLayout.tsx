import { Button } from "@/components/ui/button";

type Props = {
  question: string;
  answers: string[];
  selected?: string[];
  handleSelect: (option: string) => void;
  onComplete: () => void;
};

export default function SurveyLayout({
  question,
  answers,
  selected,
  handleSelect,
  onComplete,
}: Readonly<Props>) {
  return (
    <div className="flex flex-col items-center justify-between h-screen w-screen max-w-xs mx-auto py-10">
      <h1 className="text-4xl font-bold mb-4 text-center">{question}</h1>

      <div className="flex flex-col gap-4 w-full">
        <p className="text-xs text-muted-foreground">
          Bitte wähle alle Optionen aus, die auf dich zutreffen. Du
          kannst später jederzeit deine Einstellungen ändern.
        </p>

        {answers.map((option) => (
          <Button
            key={option}
            className="w-full"
            variant={selected?.includes(option) ? "default" : "outline"}
            onClick={() => handleSelect(option)}
          >
            {option}
          </Button>
        ))}
      </div>

      <div className="w-full flex gap-2">
        <Button variant="secondary" className="w-1/2">
          Zurück
        </Button>

        <Button className="w-full" onClick={onComplete}>
          Weiter
        </Button>
      </div>
    </div>
  );
}
