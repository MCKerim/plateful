import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "./index.css";
import { BrowserRouter } from "react-router";
import App from "./App.tsx";
import { ThemeProvider } from "./components/atoms/theme-provider.tsx";
import "./i18n.ts";
import { store } from "./redux/store.ts";
import { SupabaseProvider } from "./utils/supabase.tsx";
import AppUrlListener from "./components/AppUrlListener.tsx";
import { PostHogProvider } from "posthog-js/react";
import { Toaster } from "./components/ui/sonner.tsx";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Provider store={store}>
      <SupabaseProvider>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <PostHogProvider
            apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
            options={{
              api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
              defaults: "2025-05-24",
              capture_exceptions: true, // This enables capturing exceptions using Error Tracking, set to false if you don't want this
              debug: import.meta.env.MODE === "development",
            }}
          >
            <AppUrlListener />

            <App />

            <Toaster />
          </PostHogProvider>
        </ThemeProvider>
      </SupabaseProvider>
    </Provider>
  </BrowserRouter>
);
