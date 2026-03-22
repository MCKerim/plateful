import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, ChevronRight, Check } from "lucide-react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Mission {
  label: string;
  completed: boolean;
  route: string;
}

export default function GettingStartedCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);

  const missions: Mission[] = [
    { label: t("home.gettingStarted.importRecipes"), completed: true, route: "/urlImport" },
    { label: t("home.gettingStarted.chatWithChef"), completed: true, route: "/chatbot" },
    { label: t("home.gettingStarted.planMeals"), completed: true, route: "/planner" },
  ];

  const completedCount = missions.filter((m) => m.completed).length;
  const allCompleted = completedCount === missions.length;

  return (
    <Card className="mb-4">
      <CardHeader className="p-4 pb-4">
        <button
          className="flex w-full items-center justify-between"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          <div className="flex flex-col items-start gap-0.5">
            <span className="second-font text-base font-semibold leading-none">
              {t("home.gettingStarted.title")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("home.gettingStarted.subtitle")}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp size={18} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={18} className="text-muted-foreground" />
          )}
        </button>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${(completedCount / missions.length) * 100}%` }}
          />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="px-4 pt-0 pb-4">
          <ul className="flex flex-col gap-3">
            {missions.map((mission, i) => (
              <li key={i}>
                <button
                  className="flex w-full items-center gap-3"
                  onClick={() => navigate(mission.route)}
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      mission.completed
                        ? "bg-accent text-accent-foreground border-accent"
                        : "border-border bg-transparent text-transparent"
                    }`}
                  >
                    <Check className="!size-3" />
                  </div>
                  <span className={`flex-1 text-left text-sm ${mission.completed ? "line-through text-muted-foreground" : ""}`}>{mission.label}</span>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>

          {allCompleted && (
            <Button className="mt-4 w-full" variant="accent">
              {t("home.gettingStarted.claimReward")}
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
