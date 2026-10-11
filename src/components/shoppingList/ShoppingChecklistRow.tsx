import { Check, CircleCheck, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import RecipeCover from "@/components/shoppingList/RecipeCover";
import { cn } from "@/lib/utils";

type Props = {
  isSelected: boolean;
  emoji: string;
  /** Empty for a line without one. */
  amount: string;
  name: string;
  isStaple?: boolean;
  onList?: boolean;
  /** The covers of the recipes a merged line is for (the planner week's checklist). */
  covers?: (string | null)[];
  onToggle: () => void;
};

/**
 * One line of an add-to-list checklist (a recipe's, the planner week's): the
 * mark, the picture, the amount as the list will get it, the name, then why it
 * starts off (a staple) or that it is on the list already.
 */
export default function ShoppingChecklistRow({
  isSelected,
  emoji,
  amount,
  name,
  isStaple = false,
  onList = false,
  covers = [],
  onToggle,
}: Readonly<Props>) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isSelected}
      className={cn(
        "flex w-full items-center gap-3 py-1.5 text-left",
        !isSelected && "text-muted-foreground"
      )}
      onClick={onToggle}
    >
      <ShoppingCheckMark isSelected={isSelected} />
      <span
        className={cn("w-7 shrink-0 text-center text-xl", !isSelected && "opacity-60 grayscale")}
        aria-hidden
      >
        {emoji}
      </span>
      <span className="min-w-0 flex-1">
        {amount && <span className="mr-1.5 font-semibold tabular-nums">{amount}</span>}
        <span className="break-words">{name}</span>
      </span>
      {isStaple ? (
        <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          {t("shoppingList.checklist.staple")}
        </span>
      ) : (
        onList && (
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {t("shoppingList.checklist.onList")}
          </span>
        )
      )}
      {covers.length > 0 && (
        <span className="flex shrink-0 items-center gap-1" aria-hidden>
          <span className="flex">
            {covers.slice(0, 3).map((url, index) => (
              <span
                key={index}
                className={cn(
                  "-ml-1.5 size-[22px] overflow-hidden rounded-md border-[1.5px] border-background first:ml-0",
                  !isSelected && "grayscale"
                )}
              >
                <RecipeCover url={url} exists placeholder="" />
              </span>
            ))}
          </span>
          {covers.length > 3 && (
            <span className="text-[11px] font-medium text-muted-foreground">
              +{covers.length - 3}
            </span>
          )}
        </span>
      )}
    </button>
  );
}

/** The mark in front of a checklist line (an ingredient, a planned meal). */
export function ShoppingCheckMark({ isSelected }: Readonly<{ isSelected: boolean }>) {
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
        isSelected ? "border-accent bg-accent text-accent-foreground" : "border-muted-foreground/50"
      )}
      aria-hidden
    >
      {isSelected && <Check className="size-4" strokeWidth={3} />}
    </span>
  );
}

/** The pinned "Add N items" button under such a checklist. */
export function ShoppingAddButton({
  count,
  isAdding,
  onAdd,
}: Readonly<{ count: number; isAdding: boolean; onAdd: () => void }>) {
  const { t } = useTranslation();
  return (
    <Button
      variant="accent"
      size="lg"
      className="w-full rounded-full"
      disabled={count === 0 || isAdding}
      onClick={onAdd}
    >
      {isAdding ? <Loader2 className="animate-spin" /> : t("shoppingList.checklist.add", { count })}
    </Button>
  );
}

/**
 * What an add-to-list sheet shows once the add went through: the result, with
 * the list one tap away. The confirmation lives where the action was, not in a
 * toast.
 */
export function ShoppingAddedConfirmation({
  count,
  onOpenList,
}: Readonly<{ count: number; onOpenList: () => void }>) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-4 px-6 pt-10 pb-8">
      <CircleCheck className="size-14 text-accent" />
      <p className="text-center text-lg font-semibold">
        {t("shoppingList.checklist.added", { count })}
      </p>
      <Button variant="accent" size="lg" className="mt-6 w-full rounded-full" onClick={onOpenList}>
        {t("shoppingList.checklist.openList")}
      </Button>
    </div>
  );
}
