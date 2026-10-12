import { Timer } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  name: string;
  imageUrl: string | null;
  /** The next timer's countdown text, when one runs. */
  countdown: string | null;
  onClick: () => void;
};

/** "Cooking now", floating above the bottom navigation on every tab: cover, name and the next timer. Tap returns to the step. */
export default function CookingPill({ name, imageUrl, countdown, onClick }: Readonly<Props>) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("cooking.returnTo", { name })}
      className="fixed bottom-[84px] left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-[30rem] -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-card/95 py-2 pl-2 pr-4 text-left shadow-lg backdrop-blur"
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="size-9 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="size-9 shrink-0 rounded-full bg-secondary" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{name}</span>
        <span className="block text-xs text-muted-foreground">{t("cooking.cookingNow")}</span>
      </span>
      {countdown && (
        <span className="flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums text-accent">
          <Timer className="size-4" />
          {countdown}
        </span>
      )}
    </button>
  );
}
