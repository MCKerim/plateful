import { ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router";
import userReducer from "@/redux/slices/userSlice";
import householdReducer from "@/redux/slices/householdSlice";
import chatbotReducer from "@/redux/slices/chatbotSlice";
import filterAndSortingReducer from "@/redux/slices/filterAndSortingSlice";

// Create a test store with optional preloaded state
export function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      user: userReducer,
      household: householdReducer,
      chatbot: chatbotReducer,
      filterAndSorting: filterAndSortingReducer,
    },
    preloadedState,
  });
}

// Create a test query client with shorter retry settings
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface TestProvidersProps {
  children: ReactNode;
  preloadedState?: Record<string, unknown>;
  queryClient?: QueryClient;
}

// All-in-one test wrapper with all providers
export function TestProviders({
  children,
  preloadedState = {},
  queryClient,
}: Readonly<TestProvidersProps>) {
  const store = createTestStore(preloadedState);
  const client = queryClient ?? createTestQueryClient();

  return (
    <BrowserRouter>
      <Provider store={store}>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </Provider>
    </BrowserRouter>
  );
}
