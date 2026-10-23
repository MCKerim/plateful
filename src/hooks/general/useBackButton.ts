import { useEffect } from "react";
import { App } from "@capacitor/app";

// What the mounted page wants Android's back button to do instead of going back.
let pageHandler: (() => void) | null = null;

// Radix's and vaul's open layers: dialogs, sheets, drawers, popovers, menus, selects.
const OPEN_LAYER = ["dialog", "alertdialog", "menu", "listbox"]
  .map((role) => `[role="${role}"][data-state="open"]`)
  .join(", ");

/**
 * The app's one listener for Android's back button, mounted once in `App`.
 * An open dialog, sheet or menu closes first, as in a native app; before,
 * back left the page under it. Else the page's own handler runs, else the
 * WebView goes back, which is what Capacitor does while nothing listens.
 */
export function useBackButtonListener() {
  useEffect(() => {
    const listener = App.addListener("backButton", ({ canGoBack }) => {
      if (document.querySelector(OPEN_LAYER)) {
        // Radix closes only the topmost layer on Escape.
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      } else if (pageHandler) {
        pageHandler();
      } else if (canGoBack) {
        window.history.back();
      }
    });
    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, []);
}

/** Replaces going back with `handler` while the calling page is mounted. */
export function useBackButton(handler: () => void) {
  useEffect(() => {
    pageHandler = handler;
    return () => {
      if (pageHandler === handler) pageHandler = null;
    };
  }, [handler]);
}
