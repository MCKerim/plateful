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

export function useSafeArea() {
  const [insets, setInsets] = useState<SafeAreaInsets>(DEFAULT_INSETS);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    SafeArea.getSafeAreaInsets()
      .then(({ insets }) => setInsets(insets))
      .catch((err) => console.warn("Failed to get safe area insets:", err));

    let listenerHandle: { remove: () => void } | null = null;

    SafeArea.addListener("safeAreaChanged", ({ insets }) => {
      setInsets(insets);
    })
      .then((handle) => {
        listenerHandle = handle;
      })
      .catch((err) => console.warn("Failed to add safe area listener:", err));

    return () => {
      listenerHandle?.remove();
    };
  }, []);

  return insets;
}
