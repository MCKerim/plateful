export type HouseholdMission = {
  missionId: string;
  missionSet: string;
  scope: "household" | "user";
  requiredCount: number;
  progress: number;
  completed: boolean;
  completedAt: string | null;
};

export type HouseholdReward = {
  id: string;
  missionSet: string;
  badgeId: string;
  claimedAt: string;
  claimedBy: string;
};
