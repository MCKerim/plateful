import { ArrowRight, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { contentLanguage } from "@/lib/contentLanguage";
import { shoppingEmoji } from "@/lib/shopping-list/emoji";
import { itemAmountText, type ShoppingListItem } from "@/lib/shopping-list/item";

type Props = {
  item: ShoppingListItem;
  /** On the list a tap buys it; in "recently bought" it puts it back. */
  onClick?: () => void;
  /** Dimmed: off the list, one tap puts it back. */
  dimmed?: boolean;
  /** Briefly outlined: a typed line turned out to be this item. */
  highlighted?: boolean;
  /**
   * The item as it stands on the list now, when `item` previews an add to it
   * (the add sheet): outlined, "Already on the list", and the amount shows the
   * change ("10 → 12").
   */
  onListNow?: ShoppingListItem | null;
  /** Opens the item's details; absent hides the button. */
  onDetails?: () => void;
};

/** One product as a row: the picture, the name and this trip's amount. */
export default function ShoppingItemCard({
  item,
  onClick,
  dimmed = false,
  highlighted = false,
  onListNow = null,
  onDetails,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const locale = contentLanguage();
  const amount = itemAmountText(item, locale);
  const before = onListNow ? itemAmountText(onListNow, locale) : null;
  const changed = before !== null && before !== amount;

  return (
    <div
      className={cn(
        "flex min-h-[72px] items-center gap-1 rounded-2xl bg-card p-2.5 ring-2 ring-transparent transition-[box-shadow,opacity] duration-300",
        (highlighted || onListNow) && "ring-accent",
        dimmed && "opacity-55"
      )}
      onContextMenu={
        onDetails
          ? (event) => {
              event.preventDefault();
              onDetails();
            }
          : undefined
      }
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left active:scale-[0.98] transition-transform"
        onClick={onClick}
      >
        <span
          className="flex size-[52px] shrink-0 items-center justify-center text-[34px]"
          aria-hidden
        >
          {shoppingEmoji(item.ingredientSlug, item.name, item.aisle)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="line-clamp-2 text-sm font-medium break-words">{item.name}</span>
          {changed ? (
            <span
              className="flex items-center gap-1 text-xs font-semibold tabular-nums"
              aria-label={
                before ? t("shoppingList.amountChange", { before, after: amount }) : amount
              }
            >
              {before && (
                <>
                  <span className="text-muted-foreground">{before}</span>
                  <ArrowRight className="size-3 text-muted-foreground" aria-hidden />
                </>
              )}
              <span className="text-accent">{amount}</span>
            </span>
          ) : (
            amount && (
              <span className="truncate text-xs font-semibold tabular-nums text-muted-foreground">
                {amount}
              </span>
            )
          )}
        </span>
        {onListNow && (
          <span className="shrink-0 text-right text-xs text-muted-foreground">
            {t("shoppingList.alreadyOnList")}
          </span>
        )}
      </button>
      {onDetails && (
        <button
          type="button"
          className="flex size-11 shrink-0 items-center justify-center text-muted-foreground"
          onClick={onDetails}
          aria-label={t("shoppingList.details")}
        >
          <Info className="size-5" />
        </button>
      )}
    </div>
  );
}
