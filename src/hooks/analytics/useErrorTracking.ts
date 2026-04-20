import { usePostHog } from "posthog-js/react";

export function useErrorTracking() {
  const posthog = usePostHog();
  return {
    captureError: (error: Error, context?: Record<string, unknown>) => {
      posthog?.captureException(error, context);
    },
  };
}
