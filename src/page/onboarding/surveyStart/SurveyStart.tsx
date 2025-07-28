import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router";

export default function SurveyStart() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-between h-screen w-screen max-w-xs mx-auto py-10">
      <div className="flex flex-col gap-8 w-full">
        <Progress value={0} />
      </div>

      <h1 className="text-3xl font-bold mb-4 text-center">
        Lass uns zuerst dein Erlebnis personalisieren
      </h1>

      <Button
        className="w-full h-12 rounded-full font-semibold text-base shadow-lg shadow-primary/20"
        onClick={() => navigate("/survey/1")}
      >
        Weiter
      </Button>
    </div>
  );
}
