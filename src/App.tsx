import { Route, Routes } from "react-router";
import ShoppingList from "./page/ShoppingList";
import MealPlanner from "./page/MealPlanner";
import Discover from "./page/Discover";
import Bookmarks from "./page/Bookmarks";

function App() {
  return (
    <Routes>
      <Route path="/" element={<ShoppingList />} />

      <Route path="/mealplanner" element={<MealPlanner />} />
      <Route path="/shoppinglist" element={<ShoppingList />} />
      <Route path="/discover" element={<Discover />} />
      <Route path="/bookmarks" element={<Bookmarks />} />
    </Routes>
  );
}

export default App;
