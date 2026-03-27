import { usePostHog } from "posthog-js/react";

export function useMissionsTracking() {
  const posthog = usePostHog();

  return {
    trackMissionCompleted: (missionId: string, missionSet: string) =>
      posthog?.capture("mission_completed", { mission_id: missionId, mission_set: missionSet }),

    trackRewardClaimed: (missionSet: string, badgeId: string) =>
      posthog?.capture("reward_claimed", { mission_set: missionSet, badge_id: badgeId }),

    trackMissionCardCollapsed: () =>
      posthog?.capture("mission_card_collapsed"),

    trackMissionCardExpanded: () =>
      posthog?.capture("mission_card_expanded"),

    trackMissionTapped: (missionId: string) =>
      posthog?.capture("mission_tapped", { mission_id: missionId }),
  };
}
