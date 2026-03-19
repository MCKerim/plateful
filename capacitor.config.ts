import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.kblanks.plateful",
  appName: "Plateful",
  webDir: "dist",
  plugins: {
    SocialLogin: {
      google: {
        webClientId: process.env.VITE_GOOGLE_WEB_CLIENT_ID ?? "",
        iOSClientId: process.env.VITE_GOOGLE_IOS_CLIENT_ID ?? "",
      },
    },
  },
};

export default config;
