import { useLayoutEffect, useRef } from "react";

/**
 * The ingredient list's amount column at the widest amount it holds, so every
 * name starts at the same x across all groups (like the native app). Sets
 * `--amount-w` on the list, which the rows read; amounts mark their text with
 * `data-amount`. Measured after every render: scaling the servings changes
 * the amounts.
 */
export function useAmountColumn<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const list = ref.current;
    if (!list) return;
    const amounts = list.querySelectorAll<HTMLElement>("[data-amount]");
    const widest = Math.ceil(Math.max(0, ...Array.from(amounts, (amount) => amount.offsetWidth)));
    list.style.setProperty("--amount-w", `${widest}px`);
  });
  return ref;
}
