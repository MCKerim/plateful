import { useRef, useCallback } from "react";

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  disabled?: boolean;
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  disabled = false,
}: UseSwipeOptions): SwipeHandlers {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);
  const wasDisabledDuringGesture = useRef(false);

  // Track if disabled became true at any point during the gesture
  if (disabled && touchStartX.current !== null) {
    wasDisabledDuringGesture.current = true;
  }

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    wasDisabledDuringGesture.current = false;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchCurrentX.current = e.touches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (
      wasDisabledDuringGesture.current ||
      touchStartX.current === null ||
      touchCurrentX.current === null
    ) {
      touchStartX.current = null;
      touchStartY.current = null;
      touchCurrentX.current = null;
      wasDisabledDuringGesture.current = false;
      return;
    }

    const deltaX = touchCurrentX.current - touchStartX.current;
    const absDeltaX = Math.abs(deltaX);

    if (absDeltaX > threshold) {
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchCurrentX.current = null;
    wasDisabledDuringGesture.current = false;
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
