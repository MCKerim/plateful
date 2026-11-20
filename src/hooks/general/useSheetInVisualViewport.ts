import { useEffect, type RefObject } from "react";

/** The share of what is visible a sheet may take, like `max-h-[90dvh]`. */
const MAX_SHARE = 0.9;
/**
 * Room for the bar (arrows, AutoFill, Done) Safari floats above the keyboard
 * since iOS 26. With the address pill above it the visual viewport ends at the
 * pill; without it, it reaches the keyboard and the bar covers its bottom
 * 56 px. A sheet adds `var(--keyboard-bar, 0px)` under its last control, so
 * that control scrolls clear of the bar either way.
 */
const KEYBOARD_BAR = "32px";

/**
 * Keeps a bottom sheet with text fields on the visible part of the screen
 * while the soft keyboard is up. Pass `repositionInputs={false}` to its vaul
 * `Drawer` and mark its scroll area `data-sheet-scroll`.
 *
 * iPhone Safari does not shrink the layout viewport for the keyboard. It
 * covers the bottom and scrolls the page to the focused field. vaul lifts the
 * sheet by the keyboard's height but not by that scroll, so the sheet floated
 * above the keyboard by as much, its top and first fields out of sight and its
 * `::after` an empty band below it (2026-11-20, iOS 27 Simulator). Here
 * Safari does not get to scroll (the field is moved out of its way for the
 * frame it focuses, react-aria's and vaul's trick), the sheet's own scroll
 * area shows the field, and the sheet's bottom and height follow the visual
 * viewport. The Android WebView shrinks with the keyboard, so there the
 * visual viewport stays the whole window and nothing is set.
 */
export function useSheetInVisualViewport(sheet: RefObject<HTMLElement | null>, open: boolean) {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!open || !viewport) return;

    let placed: HTMLElement | null = null;
    const place = () => {
      const element = sheet.current;
      if (!element) return;
      placed = element;
      if (viewport.height >= window.innerHeight - 1) {
        clear(element);
        return;
      }
      // What of the layout viewport lies below the visible part: the keyboard,
      // less what Safari has panned. Zero once it panned to the bottom.
      const hidden = window.innerHeight - viewport.offsetTop - viewport.height;
      element.style.bottom = `${Math.max(0, hidden)}px`;
      element.style.maxHeight = `${Math.floor(viewport.height * MAX_SHARE)}px`;
      // A floor like the timers sheet's 40vh would beat that max-height.
      element.style.minHeight = "0px";
      element.style.setProperty("--keyboard-bar", KEYBOARD_BAR);
    };

    // Moved 2000 px up while it takes focus, the field seems in view to Safari.
    let listening: HTMLElement | null = null;
    const hideFromPan = (field: HTMLElement) => {
      field.style.transform = "translateY(-2000px)";
      requestAnimationFrame(() => {
        field.style.transform = "";
      });
    };
    const onTouchEnd = (event: TouchEvent) => {
      const field = event.target;
      if (!isTextField(field) || field === document.activeElement) return;
      // Focusing it here, before the browser does, is what keeps Safari still.
      event.preventDefault();
      hideFromPan(field);
      field.focus({ preventScroll: true });
    };
    const onFocusIn = (event: FocusEvent) => {
      const field = event.target;
      if (!isTextField(field)) return;
      hideFromPan(field);
      // Once the keyboard has resized the visual viewport and the sheet.
      const reveal = () => requestAnimationFrame(() => revealInSheet(field));
      if (viewport.height < window.innerHeight - 1) reveal();
      else viewport.addEventListener("resize", reveal, { once: true });
    };
    const listen = () => {
      const element = sheet.current;
      if (!element || listening || !pansToFocus()) return;
      listening = element;
      element.addEventListener("touchend", onTouchEnd, { passive: false });
      element.addEventListener("focusin", onFocusIn);
    };

    // The sheet mounts with the first open render; measure once it is there.
    const frame = requestAnimationFrame(() => {
      place();
      listen();
    });
    viewport.addEventListener("resize", place);
    viewport.addEventListener("scroll", place);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", place);
      viewport.removeEventListener("scroll", place);
      listening?.removeEventListener("touchend", onTouchEnd);
      listening?.removeEventListener("focusin", onFocusIn);
      if (placed) clear(placed);
    };
  }, [sheet, open]);
}

/** iPhone and iPad (which says Mac): Safari pans instead of resizing. */
function pansToFocus() {
  return (
    /^iP(hone|ad)/.test(navigator.platform) ||
    (/^Mac/.test(navigator.platform) && navigator.maxTouchPoints > 1)
  );
}

function isTextField(target: EventTarget | null): target is HTMLElement {
  return (
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLInputElement &&
      !["checkbox", "radio", "range", "button", "submit", "reset", "file"].includes(target.type))
  );
}

/** Scrolls the sheet's scroll area, not the page, until the field shows. */
function revealInSheet(field: HTMLElement) {
  const area = field.closest<HTMLElement>("[data-sheet-scroll]");
  if (!area) return;
  const box = area.getBoundingClientRect();
  const rect = field.getBoundingClientRect();
  if (rect.bottom > box.bottom) area.scrollTop += rect.bottom - box.bottom + 8;
  else if (rect.top < box.top) area.scrollTop -= box.top - rect.top + 8;
}

function clear(element: HTMLElement) {
  element.style.removeProperty("bottom");
  element.style.removeProperty("max-height");
  element.style.removeProperty("min-height");
  element.style.removeProperty("--keyboard-bar");
}
