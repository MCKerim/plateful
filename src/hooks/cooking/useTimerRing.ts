import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { beep } from "@/lib/cooking/beep";
import { newlyFired, type CookingTimer } from "@/lib/cooking/timer";

/**
 * Rings a timer that runs out while the cooking screen is open: three tones
 * and a banner naming the timer and the dish, with Dismiss. Each timer rings
 * once, on the clock tick that passes its end; the per-device alarm covers
 * the screen being closed.
 */
export function useTimerRing(
  timers: readonly CookingTimer[],
  now: number,
  recipeName: string,
  dismiss: (timerId: string) => void
) {
  const { t } = useTranslation();
  const lastTick = useRef(now);

  useEffect(() => {
    const fired = newlyFired(timers, lastTick.current, now);
    lastTick.current = now;
    for (const timer of fired) {
      beep();
      toast(t("cooking.timerUp"), {
        description: `${timer.label} · ${recipeName}`,
        duration: 20_000,
        action: { label: t("cooking.dismiss"), onClick: () => dismiss(timer.id) },
      });
    }
  }, [now, timers, recipeName, dismiss, t]);
}
