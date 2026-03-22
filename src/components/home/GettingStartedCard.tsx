import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, ChevronRight, Check } from "lucide-react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
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

const STAR_COLORS = ["#ff9d00", "#ffb733", "#ffd980", "#faf9f5"];
const STAR_COUNT = 14;

function StarParticles({ active }: { active: boolean }) {
  const stars = useMemo(
    () =>
      Array.from({ length: STAR_COUNT }, (_, i) => {
        const angle = (i / STAR_COUNT) * 360 + Math.random() * 24 - 12;
        const rad = (angle * Math.PI) / 180;
        const dist = 90 + Math.random() * 60;
        return {
          id: i,
          x: Math.cos(rad) * dist,
          y: Math.sin(rad) * dist,
          rotate: Math.random() * 720 - 360,
          scale: 0.8 + Math.random() * 0.9,
          delay: Math.random() * 0.15,
          color: STAR_COLORS[i % STAR_COLORS.length],
          emoji: i % 3 === 0 ? "✦" : "★",
        };
      }),
    []
  );

  // Portal into body — zero clipping, works regardless of dialog overflow rules
  return createPortal(
    <AnimatePresence>
      {active &&
        stars.map((star) => (
          <motion.span
            key={star.id}
            aria-hidden="true"
            className="pointer-events-none fixed select-none text-xl"
            style={{ left: "50vw", top: "42vh", color: star.color, zIndex: 9999 }}
            initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
            animate={{
              x: star.x,
              y: star.y,
              scale: star.scale,
              rotate: star.rotate,
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 0.9,
              delay: star.delay,
              ease: [0.22, 1, 0.36, 1],
              opacity: { times: [0, 0.55, 1], duration: 0.9 },
            }}
          >
            {star.emoji}
          </motion.span>
        ))}
    </AnimatePresence>,
    document.body
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
          <StarParticles active={rewardDialogOpen} />

          {/* Cartoon badge reveal */}
          <div className="relative mx-auto mb-2 flex h-32 w-32 items-center justify-center">
            {rewardDialogOpen && <Starburst />}
            <span className="animate-badge-pop relative z-10 text-7xl leading-none">🏅</span>
          </div>

          <DialogHeader>
            <DialogTitle className="second-font text-xl text-center">
              {t("home.gettingStarted.rewardDialog.title")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t("home.gettingStarted.rewardDialog.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center gap-2 bg-accent text-accent-foreground rounded-xl px-4 py-3 mx-auto w-full">
            <span className="text-2xl">🏅</span>
            <span className="second-font text-base font-semibold">
              {t(`badges.${BADGE_ID}`)}
            </span>
          </div>

          <div className="flex flex-col gap-2 mt-1">
            <Button
              className="w-full"
              variant="accent"
              onClick={() => {
                setRewardDialogOpen(false);
                navigate("/householdSettings");
              }}
            >
              {t("home.gettingStarted.rewardDialog.viewRewards")}
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => setRewardDialogOpen(false)}>
              {t("home.gettingStarted.rewardDialog.cta")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
