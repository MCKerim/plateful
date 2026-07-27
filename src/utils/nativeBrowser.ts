import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

export const openBrowser = async (url: string) => {
  // Open the browser only if we are on a native platform (in-app)
  if (Capacitor.isNativePlatform()) {
    await Browser.open({
      url,
      presentationStyle: "popover",
    });
  } else {
    globalThis.location.href = url;
  }
};

/**
 * Full-page navigation to an external URL in the current tab.
 *
 * Used by the OAuth consent screen to hand the user back to the app that asked
 * for authorization. `openBrowser` is wrong there: the redirect has to *replace*
 * this page to complete the OAuth flow, not open alongside it. Kept in this
 * module because it already owns every `location.href` assignment.
 */
export const redirectTo = (url: string) => {
  globalThis.location.href = url;
};

export const closeBrowser = async () => {
  if (Capacitor.isNativePlatform()) {
    await Browser.close();
  }
};
