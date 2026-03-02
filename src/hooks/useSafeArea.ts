import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { SafeArea } from "capacitor-plugin-safe-area";

function applyCssVars(insets: { top: number; right: number; bottom: number; left: number }) {
  const root = document.documentElement;
  root.style.setProperty("--safe-area-top", `${insets.top}px`);
  root.style.setProperty("--safe-area-bottom", `${insets.bottom}px`);
  root.style.setProperty("--safe-area-left", `${insets.left}px`);
  root.style.setProperty("--safe-area-right", `${insets.right}px`);
}

export function useSafeArea() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let listenerHandle: { remove: () => void } | null = null;

    Promise.all([
      SafeArea.getSafeAreaInsets(),
      SafeArea.addListener("safeAreaChanged", ({ insets }) => {
        applyCssVars(insets);
      }),
    ])
      .then(([{ insets: initial }, handle]) => {
        if (cancelled) {
          handle.remove();
        } else {
          listenerHandle = handle;
          applyCssVars(initial);
        }
      })
      .catch((err) => console.warn("Failed to initialize safe area:", err));

    return () => {
      cancelled = true;
      listenerHandle?.remove();
    };
  }, []);
}
