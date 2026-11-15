import { useEffect, useState } from "react";

// More than a browser's address bar showing or hiding (about 56 px).
const KEYBOARD_MIN_HEIGHT = 150;

/**
 * Whether the soft keyboard is open: a text field has focus and the visual
 * viewport is well below the tallest it has been at this width. The app has
 * no Capacitor Keyboard plugin; the Android WebView shrinks with the
 * keyboard and phone browsers shrink the visual viewport, so both show here.
 * The focus check keeps a desktop window made shorter from counting.
 */
export function useKeyboardOpen() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    let width = viewport.width;
    let fullHeight = viewport.height;

    const onResize = () => {
      // A keyboard keeps the width; turning the phone or pinch zoom start over.
      if (viewport.width !== width) {
        width = viewport.width;
        fullHeight = viewport.height;
      }
      fullHeight = Math.max(fullHeight, viewport.height);
      setOpen(
        fullHeight - viewport.height > KEYBOARD_MIN_HEIGHT &&
          document.activeElement?.matches("input, textarea, [contenteditable]") === true
      );
    };

    viewport.addEventListener("resize", onResize);
    return () => viewport.removeEventListener("resize", onResize);
  }, []);

  return open;
}
