import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

export interface SharedData {
  title?: string;
  text?: string;
  url?: string;
}

export class ShareHandler {
  private static listeners: ((data: SharedData) => void)[] = [];

  static initialize() {
    if (Capacitor.isNativePlatform()) {
      // Listen for custom share intent event from Android
      window.addEventListener("shareIntent", ((event: CustomEvent) => {
        const intentData = event.detail;
        const sharedData: SharedData = {
          title: intentData.title,
          text: intentData.text,
          url: this.extractUrlFromText(intentData.text),
        };

        // Notify all listeners
        this.listeners.forEach((listener) => listener(sharedData));
      }) as EventListener);

      // Keep the existing appUrlOpen listener as fallback
      App.addListener("appUrlOpen", (data) => {
        this.handleSharedContent(data.url);
      });

      App.getLaunchUrl().then((result) => {
        if (result?.url) {
          this.handleSharedContent(result.url);
        }
      });
    }
  }

  static addListener(callback: (data: SharedData) => void) {
    this.listeners.push(callback);
  }

  static removeListener(callback: (data: SharedData) => void) {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }

  private static handleSharedContent(url: string) {
    if (url) {
      // Parse the shared content from the URL
      const urlObj = new URL(url);
      const intent = urlObj.searchParams.get("intent");

      if (intent) {
        try {
          // Decode the intent data
          const intentData = JSON.parse(decodeURIComponent(intent));
          const sharedData: SharedData = {
            title:
              intentData.title || intentData["android.intent.extra.SUBJECT"],
            text: intentData.text || intentData["android.intent.extra.TEXT"],
            url: this.extractUrlFromText(
              intentData.text || intentData["android.intent.extra.TEXT"]
            ),
          };

          // Notify all listeners
          this.listeners.forEach((listener) => listener(sharedData));
        } catch (error) {
          console.error("Error parsing shared content:", error);
        }
      }
    }
  }

  private static extractUrlFromText(text?: string): string | undefined {
    if (!text) return undefined;

    const urlRegex = /https?:\/\/[^\s]+/;
    const urlMatch = urlRegex.exec(text);
    return urlMatch ? urlMatch[0] : undefined;
  }
}
