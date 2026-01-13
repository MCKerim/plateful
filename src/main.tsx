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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SupabaseProvider>
          <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <PostHogProvider
              apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
              options={{
                api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
                defaults: "2025-05-24",
                capture_exceptions: true,
                debug: import.meta.env.MODE === "development",
              }}
            >
              <AppUrlListener />

              <App />

              <Toaster />
            </PostHogProvider>
          </ThemeProvider>
        </SupabaseProvider>
      </QueryClientProvider>
    </Provider>
  </BrowserRouter>
);
