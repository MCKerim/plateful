import { useState, useCallback } from "react";
import {
  requestNotificationPermission,
  checkNotificationPermission,
  isNotificationSupported,
} from "@/lib/notifications";

export function useNotificationPermission() {
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
      return granted;
    } finally {
      setIsRequesting(false);
    }
  }, []);

  return {
    permissionState,
    isRequesting,
    checkPermission,
    requestPermission,
    isSupported: isNotificationSupported(),
  };
}
