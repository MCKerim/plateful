import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { KeepAwake } from "@capacitor-community/keep-awake";

/**
 * Keeps the screen awake while the component is mounted.
 * Uses the Screen Wake Lock API for web browsers and
 * the KeepAwake Capacitor plugin for native mobile apps.
 */
export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();

    const requestWakeLock = async () => {
      if (isNative) {
        try {
          await KeepAwake.keepAwake();
        } catch (error) {
          console.warn("Failed to enable KeepAwake:", error);
        }
      } else if ("wakeLock" in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        } catch (error) {
          console.warn("Failed to acquire wake lock:", error);
        }
      }
    };

    const releaseWakeLock = async () => {
      if (isNative) {
        try {
          await KeepAwake.allowSleep();
        } catch (error) {
          console.warn("Failed to disable KeepAwake:", error);
        }
      } else if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        } catch (error) {
          console.warn("Failed to release wake lock:", error);
        }
      }
    };

    // Re-acquire wake lock when page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };

    requestWakeLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseWakeLock();
    };
  }, []);
}
