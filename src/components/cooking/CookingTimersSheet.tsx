import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, CircleCheck, MoreHorizontal, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { countdownText, durationLabel, hasFired, remainingSeconds, type CookingTimer } from "@/lib/cooking/timer";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timers: CookingTimer[];
  now: number;
  /** The 1-based step a timer belongs to, null for a hand-made one. */
  stepNumber: (stepId: string | null) => number | null;
  onAddTime: (id: string, seconds: number) => void;
  onReset: (id: string) => void;
  onStop: (id: string) => void;
  onStart: (seconds: number, label: string) => void;
};

/** Every timer of the pot with its countdown and quiet actions, plus a hand-made timer pinned below. No pause, by design. */
export default function CookingTimersSheet({
  open,
  onOpenChange,
  timers,
  now,
  stepNumber,
  onAddTime,
  onReset,
  onStop,
  onStart,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const [minutes, setMinutes] = useState("5");
  const newSeconds = Math.max(0, Math.min(180, Math.round(Number(minutes) || 0))) * 60;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerTitle className="sr-only">{t("cooking.timers")}</DrawerTitle>
        <div className="flex min-h-[40vh] max-h-[75vh] flex-col px-4 pb-10 pt-4">
          <div className="flex-1 overflow-y-auto">
            {timers.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
                <Timer className="size-8 text-muted-foreground" />
                <p className="font-semibold">{t("cooking.timersEmpty")}</p>
                <p className="text-sm text-muted-foreground">{t("cooking.timersEmptyHint")}</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {timers.map((timer) => {
                  const fired = hasFired(timer, now);
                  const step = stepNumber(timer.stepId);
                  return (
                    <li key={timer.id} className="flex items-center gap-3 py-3">
                      <button
                        type="button"
                        onClick={() => fired && onStop(timer.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{timer.label}</span>
                          {step !== null && (
                            <span className="block text-xs text-muted-foreground">
                              {t("cooking.stepN", { n: step })}
                            </span>
                          )}
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-1 text-lg font-semibold tabular-nums",
                            fired ? "text-accent" : "text-foreground"
                          )}
                        >
                          {fired ? <CircleCheck className="size-5" /> : countdownText(remainingSeconds(timer, now))}
                          {fired && t("cooking.timerDone")}
                        </span>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={t("cooking.timerOptions")}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onAddTime(timer.id, 60)}>{t("cooking.addMinute")}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onAddTime(timer.id, 300)}>
                            {t("cooking.addFiveMinutes")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onAddTime(timer.id, -60)}>
                            {t("cooking.subtractMinute")}
                          </DropdownMenuItem>
                          {timer.durationSeconds !== null && (
                            <DropdownMenuItem onClick={() => onReset(timer.id)}>
                              {fired ? t("cooking.repeat") : t("cooking.reset")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => onStop(timer.id)} className="text-destructive">
                            {fired ? t("cooking.dismiss") : t("cooking.stop")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <form
            className="mt-4 flex items-center gap-2 border-t border-border pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (newSeconds > 0) onStart(newSeconds, durationLabel(newSeconds));
            }}
          >
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={180}
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
              aria-label={t("cooking.minutesShort")}
              className="w-20 text-center"
            />
            <span className="text-sm text-muted-foreground">{t("cooking.minutesShort")}</span>
            <Button type="submit" variant="accent" className="ml-auto rounded-full" disabled={newSeconds === 0}>
              <Check />
              {t("cooking.startTimer")}
            </Button>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
