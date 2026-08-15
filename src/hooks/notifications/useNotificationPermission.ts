import { useState, useCallback } from "react";
import { usePostHog } from "posthog-js/react";
import {
  requestNotificationPermission,
  checkNotificationPermission,
  isNotificationSupported,
} from "@/lib/notifications";
import { AnalyticsEvent } from "@/lib/analyticsEvents";

export function useNotificationPermission() {
  const posthog = usePostHog();
  const [permissionState, setPermissionState] = useState<"granted" | "denied" | "prompt">("prompt");
  const [isRequesting, setIsRequesting] = useState(false);

  const checkPermission = useCallback(async () => {
    const status = await checkNotificationPermission();
    setPermissionState(status);
    return status;
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isNotificationSupported()) {
      setPermissionState("denied");
      return false;
    }

    setIsRequesting(true);
    try {
      const granted = await requestNotificationPermission();
      setPermissionState(granted ? "granted" : "denied");
      posthog?.capture(
        granted ? AnalyticsEvent.pushPermissionGranted : AnalyticsEvent.pushPermissionDenied
      );
      return granted;
    } finally {
      setIsRequesting(false);
    }
  }, [posthog]);

  return {
    permissionState,
    isRequesting,
    checkPermission,
    requestPermission,
    isSupported: isNotificationSupported(),
  };
}
