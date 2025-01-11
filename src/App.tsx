import BottomNav from "./components/atoms/BottomNav";
import Header from "./components/atoms/Header";
import { ThemeProvider } from "./components/theme-provider";
import ShoppingList from "./page/ShoppingList";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="w-full max-w-lg flex flex-col items-center m-auto">
        <Header />

        <ShoppingList />
  
        <BottomNav />
      </div>
    </ThemeProvider>
  );
}

export default App;
