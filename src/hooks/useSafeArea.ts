import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { SafeArea } from "capacitor-plugin-safe-area";

interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const DEFAULT_INSETS: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };

function applyCssVars(insets: SafeAreaInsets) {
  const root = document.documentElement;
  root.style.setProperty("--safe-area-top", `${insets.top}px`);
  root.style.setProperty("--safe-area-bottom", `${insets.bottom}px`);
  root.style.setProperty("--safe-area-left", `${insets.left}px`);
  root.style.setProperty("--safe-area-right", `${insets.right}px`);
}

export function useSafeArea() {
  const [insets, setInsets] = useState<SafeAreaInsets>(DEFAULT_INSETS);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let listenerHandle: { remove: () => void } | null = null;

    Promise.all([
      SafeArea.getSafeAreaInsets(),
      SafeArea.addListener("safeAreaChanged", ({ insets }) => {
        setInsets(insets);
        applyCssVars(insets);
      }),
    ])
      .then(([{ insets: initial }, handle]) => {
        if (cancelled) {
          handle.remove();
        } else {
          listenerHandle = handle;
          setInsets(initial);
          applyCssVars(initial);
        }
      })
      .catch((err) => console.warn("Failed to initialize safe area:", err));

    return () => {
      cancelled = true;
      listenerHandle?.remove();
    };
  }, []);

  return insets;
}
