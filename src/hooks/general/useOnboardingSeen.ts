import { useState, useEffect, useCallback } from "react";
import { Preferences } from "@capacitor/preferences";

export function useOnboardingSeen(storageKey: string) {
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    Preferences.get({ key: storageKey }).then(({ value }) => {
      if (!cancelled) {
        setSeen(value === "true");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  const dismiss = useCallback(async () => {
    setSeen(true);
    await Preferences.set({ key: storageKey, value: "true" });
  }, [storageKey]);

  return { seen, dismiss };
}
