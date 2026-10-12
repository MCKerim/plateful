import { useLocation, useNavigate } from "react-router";
import CookingPill from "@/components/cooking/CookingPill";
import { useHouseholdCookingSessions } from "@/hooks/cooking/useHouseholdCookingSessions";
import { useClock } from "@/hooks/cooking/useClock";
import { lastOpenedRecipeId } from "@/lib/cooking/lastOpened";
import { countdownText, remainingSeconds, soonestRunningTimer } from "@/lib/cooking/timer";

/** Mounts the pill while this cook is in a session, except on the cooking screen itself. */
export default function CookingPillHost() {
  const { data } = useHouseholdCookingSessions();
  const navigate = useNavigate();
  const location = useLocation();
  const mine = data?.mine ?? [];
  const lastOpened = lastOpenedRecipeId();
  const shown = mine.find((item) => item.recipe.id === lastOpened) ?? mine[0];
  const timers = data?.timers.filter((timer) => timer.sessionId === shown?.session.id) ?? [];
  const now = useClock(timers.some((timer) => timer.endsAt !== null));
  const next = soonestRunningTimer(timers, now);

  if (!shown || location.pathname.startsWith("/cooking")) return null;
  return (
    <CookingPill
      name={shown.recipe.name}
      imageUrl={shown.recipe.imageUrl}
      countdown={next ? countdownText(remainingSeconds(next, now)) : null}
      onClick={() => navigate(`/cooking/${shown.recipe.id}`)}
    />
  );
}
