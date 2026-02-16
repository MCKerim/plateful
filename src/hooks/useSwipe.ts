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
  threshold = 75,
  disabled = false,
}: UseSwipeOptions): SwipeHandlers {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);
  const wasDisabledDuringGesture = useRef(false);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    wasDisabledDuringGesture.current = false;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchCurrentX.current = e.touches[0].clientX;
  }, []);

  const touchCurrentY = useRef<number | null>(null);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    // Track if disabled became true at any point during the gesture
    if (disabledRef.current && touchStartX.current !== null) {
      wasDisabledDuringGesture.current = true;
    }
    touchCurrentX.current = e.touches[0].clientX;
    touchCurrentY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (
      wasDisabledDuringGesture.current ||
      touchStartX.current === null ||
      touchCurrentX.current === null ||
      touchStartY.current === null ||
      touchCurrentY.current === null
    ) {
      touchStartX.current = null;
      touchStartY.current = null;
      touchCurrentX.current = null;
      touchCurrentY.current = null;
      wasDisabledDuringGesture.current = false;
      return;
    }

    const deltaX = touchCurrentX.current - touchStartX.current;
    const deltaY = touchCurrentY.current - touchStartY.current;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Only trigger swipe if horizontal movement is greater than vertical
    if (absDeltaX > threshold && absDeltaX > absDeltaY) {
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchCurrentX.current = null;
    touchCurrentY.current = null;
    wasDisabledDuringGesture.current = false;
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
