import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, ChevronRight, Check } from "lucide-react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useHouseholdMissions } from "@/hooks/missions/useHouseholdMissions";
import { useHouseholdRewards } from "@/hooks/missions/useHouseholdRewards";
import { useClaimReward } from "@/hooks/missions/useClaimReward";
import { useMissionsTracking } from "@/hooks/analytics/useMissionsTracking";

const MISSION_SET = "onboarding";
const BADGE_ID = "onboarding_complete";

const MISSION_ROUTES: Record<string, string> = {
  import_recipes: "/urlImport",
  chat_with_chef: "/chatbot",
  plan_meals: "/planner",
};

// Starburst SVG ray angles (12 rays)
const RAYS = Array.from({ length: 12 }, (_, i) => i * 30);

function Starburst() {
  return (
    <svg
      className="animate-starburst absolute inset-0 h-full w-full"
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      {RAYS.map((angle) => (
        <line
          key={angle}
          x1="60"
          y1="60"
          x2={60 + 52 * Math.cos((angle * Math.PI) / 180)}
          y2={60 + 52 * Math.sin((angle * Math.PI) / 180)}
          stroke="#ff9d00"
          strokeWidth={angle % 60 === 0 ? 5 : 2.5}
          strokeLinecap="round"
          opacity={angle % 60 === 0 ? 0.9 : 0.55}
        />
      ))}
    </svg>
  );
}

export default function GettingStartedCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);

  const { data: missions = [], isLoading: missionsLoading } = useHouseholdMissions();
  const { data: rewards = [], isLoading: rewardsLoading } = useHouseholdRewards();
  const claimReward = useClaimReward();
  const tracking = useMissionsTracking();

  const onboardingMissions = missions.filter((m) => m.missionSet === MISSION_SET);
  const completedCount = onboardingMissions.filter((m) => m.completed).length;
  const totalCount = onboardingMissions.length;
  const allCompleted = totalCount > 0 && completedCount === totalCount;
  const alreadyClaimed = rewards.some((r) => r.missionSet === MISSION_SET);

  useEffect(() => {
    if (claimReward.isSuccess) setRewardDialogOpen(true);
  }, [claimReward.isSuccess]);

  // Hide card once reward is claimed and dialog is closed
  if (!missionsLoading && !rewardsLoading && alreadyClaimed && !rewardDialogOpen) return null;

  function handleToggle() {
    if (isExpanded) {
      tracking.trackMissionCardCollapsed();
    } else {
      tracking.trackMissionCardExpanded();
    }
    setIsExpanded((prev) => !prev);
  }

  function handleMissionTap(missionId: string) {
    tracking.trackMissionTapped(missionId);
    navigate(MISSION_ROUTES[missionId] ?? "/home");
  }

  function handleClaimReward() {
    tracking.trackRewardClaimed(MISSION_SET, BADGE_ID);
    claimReward.mutate({ missionSet: MISSION_SET, badgeId: BADGE_ID });
  }

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="p-4 pb-4">
          <button className="flex w-full items-center justify-between" onClick={handleToggle}>
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

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%" }}
            />
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="px-4 pt-0 pb-4">
            <ul className="flex flex-col gap-3">
              {onboardingMissions.map((mission) => (
                <li key={mission.missionId}>
                  <button
                    className="flex w-full items-center gap-3"
                    onClick={() => handleMissionTap(mission.missionId)}
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
                    <span
                      className={`flex-1 text-left text-sm ${
                        mission.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {t(`home.gettingStarted.missions.${mission.missionId}`)}
                    </span>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>

            {allCompleted && (
              <Button
                className="mt-4 w-full"
                variant="accent"
                disabled={claimReward.isPending}
                onClick={handleClaimReward}
              >
                {claimReward.isPending
                  ? t("home.gettingStarted.claimingReward")
                  : t("home.gettingStarted.claimReward")}
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      <Dialog open={rewardDialogOpen} onOpenChange={setRewardDialogOpen}>
        <DialogContent className="text-center">
          <DialogHeader>
            {/* Cartoon badge reveal */}
            <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
              {rewardDialogOpen && <Starburst />}
              <span className="animate-badge-pop relative z-10 text-7xl leading-none">⭐</span>
            </div>

            <DialogTitle className="second-font text-xl text-center">
              {t("home.gettingStarted.rewardDialog.title")}
            </DialogTitle>

            <DialogDescription className="text-center">
              {t("home.gettingStarted.rewardDialog.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="mx-auto w-fit rotate-[-2deg] rounded-2xl border-2 border-dashed bg-card px-5 py-2 text-center shadow-md mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏅</span>
              <p className="second-font text-base font-semibold text-foreground leading-tight">
                {t(`badges.${BADGE_ID}`)}
              </p>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => {
              setRewardDialogOpen(false);
              navigate("/householdSettings");
            }}
          >
            {t("home.gettingStarted.rewardDialog.viewRewards")}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
