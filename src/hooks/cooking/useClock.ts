import { useCallback, useSyncExternalStore } from "react";

const second = () => Math.floor(Date.now() / 1000) * 1000;

/** The current time to the second, re-rendering once a second only while `active`, so countdowns move and idle screens don't. */
export function useClock(active: boolean): number {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!active) return () => {};
      const interval = setInterval(onChange, 1000);
      return () => clearInterval(interval);
    },
    [active]
  );
  return useSyncExternalStore(subscribe, second, second);
}
