import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "./index.css";
import { BrowserRouter } from "react-router";
import App from "./App.tsx";
import { ThemeProvider } from "./components/general/theme-provider.tsx";
import "./i18n.ts";
import { store } from "./redux/store.ts";
import { SupabaseProvider } from "./utils/supabase.tsx";
import { RevenueCatProvider } from "./providers/RevenueCatProvider.tsx";
import AppUrlListener from "./components/AppUrlListener.tsx";
import { PostHogProvider } from "posthog-js/react";
import posthog from "posthog-js";
import { Toaster } from "./components/ui/sonner.tsx";
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// React Query configuration
const QUERY_STALE_TIME = 1000 * 30; // 30 seconds - responsive to household changes
const QUERY_GC_TIME = 1000 * 60 * 10; // 10 minutes - keep unused cache for navigation

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      posthog.captureException(error as Error, {
        query_key: JSON.stringify(query.queryKey),
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME,
      gcTime: QUERY_GC_TIME,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true, // Refetch when network reconnects
      networkMode: "offlineFirst", // Show cache first, then refetch
    },
  },
});

const isDevelopment = import.meta.env.MODE === "development";

function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  // Skip PostHog in development
  if (isDevelopment) {
    return <ErrorBoundary>{children}</ErrorBoundary>;
  }

  return (
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={{
        api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
        defaults: "2025-05-24",
        capture_exceptions: true,
      }}
    >
      <ErrorBoundary>{children}</ErrorBoundary>
    </PostHogProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SupabaseProvider>
          <RevenueCatProvider>
            <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <AppProviders>
              <AppUrlListener />

              <App />

              {import.meta.env.MODE === "development" && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}

              <Toaster />
            </AppProviders>
          </ThemeProvider>
          </RevenueCatProvider>
        </SupabaseProvider>
      </QueryClientProvider>
    </Provider>
  </BrowserRouter>
);
