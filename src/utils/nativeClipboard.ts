import { Capacitor } from "@capacitor/core";
import { Clipboard } from "@capacitor/clipboard";

/**
 * Reads text from the clipboard.
 * Uses Capacitor Clipboard plugin on native platforms, falls back to navigator.clipboard on web.
 */
export const readClipboardText = async (): Promise<string> => {
  if (Capacitor.isNativePlatform()) {
    const result = await Clipboard.read();
    return result.value;
  } else {
    return navigator.clipboard.readText();
  }
};

/**
 * Writes text to the clipboard.
 * Uses Capacitor Clipboard plugin on native platforms, falls back to navigator.clipboard on web.
 */
export const writeClipboardText = async (text: string): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    await Clipboard.write({ string: text });
  } else {
    await navigator.clipboard.writeText(text);
  }
};
