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

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Provider store={store}>
      <SupabaseProvider>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <AppUrlListener />
          <App />
        </ThemeProvider>
      </SupabaseProvider>
    </Provider>
  </BrowserRouter>
);
