import { useEffect, useState } from "react";

export function useScrollRestoration(scrollKey: string) {
  const [scrollRestored, setScrollRestored] = useState(false);

  // Restore scroll position on mount
  useEffect(() => {
    const savedPosition = Number.parseInt(sessionStorage.getItem(scrollKey) || "0", 10);

    if (savedPosition > 0) {
      let attempts = 0;
      const maxAttempts = 10;

      const tryRestore = () => {
        attempts++;
        window.scrollTo(0, savedPosition);

        setTimeout(() => {
          if (Math.abs(window.scrollY - savedPosition) < 50 || attempts >= maxAttempts) {
            console.log("Scroll restored after", attempts, "attempts");
            setScrollRestored(true);
          } else {
            tryRestore();
          }
        }, 100);
      };

      tryRestore();
    } else {
      setScrollRestored(true);
    }
  }, [scrollKey]);

  // Save scroll position when scrolling
  useEffect(() => {
    if (!scrollRestored) return;

    function handleScrolling() {
      sessionStorage.setItem(scrollKey, window.scrollY.toString());
    }

    window.addEventListener("scroll", handleScrolling);
    return () => {
      window.removeEventListener("scroll", handleScrolling);
    };
  }, [scrollRestored, scrollKey]);

  return scrollRestored;
}
